<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { io } from "socket.io-client";

// ============================================================================
// Tauri 后端通信（Rust 命令）
// ============================================================================
const greetMsg = ref("");
const name = ref("");

async function greet() {
  greetMsg.value = await invoke("greet", { name: name.value });
}

// ============================================================================
// Socket.IO 通信（连接 Python FastAPI 后端）
// ============================================================================

// 连接状态
const socketConnected = ref(false);
const socketStatus = ref("未连接");

// 消息历史（只保留最近的几条，避免页面过长）
const messages = ref<string[]>([]);
const maxMessages = 20;

// Socket.IO 客户端实例
let socket: ReturnType<typeof io> | null = null;

/**
 * 初始化 Socket.IO 连接
 *
 * 连接地址从 Vite 环境变量读取，开发时指向 127.0.0.1:8080。
 * Socket.IO 会自动：
 *   - 先尝试 WebSocket 连接
 *   - WebSocket 不可用时回退到 HTTP 长轮询
 *   - 连接断开后自动重连（默认最多重试 10 次）
 */
function connectSocket() {
  // VITE_API_BASE 指向后端地址，不带 /socket.io 后缀
  // Socket.IO client 会自动追加 /socket.io 路径段
  const baseUrl = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080";

  socket = io(baseUrl, {
    // 只使用 WebSocket（本地桌面应用，不需要长轮询降级）
    // 不限制 transport，让 Socket.IO 优先 WebSocket，不可用时自动降级长轮询
    // transports: ["websocket"],
    // 自动重连配置
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  // ---- Socket.IO 内置事件 ----

  socket.on("connect", () => {
    socketConnected.value = true;
    socketStatus.value = "已连接";
    addMessage(`[系统] 已连接到后端 ${baseUrl}`);
  });

  socket.on("disconnect", (reason: string) => {
    socketConnected.value = false;
    socketStatus.value = `已断开: ${reason}`;
    addMessage(`[系统] 连接断开: ${reason}`);
  });

  socket.on("connect_error", (err: Error) => {
    socketStatus.value = `连接失败: ${err.message}`;
    addMessage(`[系统] 连接错误: ${err.message}`);
  });

  // ---- 业务事件 ----

  // 接收 echo 服务端的回复
  socket.on("echo_reply", (data: { message: string; server_timestamp: number }) => {
    addMessage(`[Echo 回复] ${data.message}`);
  });

  // 接收全局广播通知
  socket.on("notification", (data: { message: string; from_sid: string }) => {
    addMessage(`[广播] ${data.message}`);
  });

  // 接收 pong 回复（应用层心跳响应）
  socket.on("pong_from_server", (data: { server_time: number; client_time: number | null }) => {
    const rtt = data.client_time ? Date.now() - data.client_time : null;
    addMessage(`[心跳] 收到 pong${rtt !== null ? `, RTT: ${rtt}ms` : ""}`);
  });
}

/**
 * 发送 echo 测试消息
 */
function sendEcho() {
  if (!socket || !socketConnected.value) return;
  socket.emit("echo", {
    message: `你好！来自前端的时间戳: ${Date.now()}`,
    client_timestamp: Date.now(),
  });
  addMessage(`[Echo 发送] 已发送`);
}

/**
 * 发送广播消息
 */
function sendBroadcast() {
  if (!socket || !socketConnected.value) return;
  socket.emit("broadcast", {
    message: `全局广播消息 — ${new Date().toLocaleTimeString()}`,
  });
  addMessage(`[广播发送] 已广播`);
}

/**
 * 发送应用层心跳
 */
function sendPing() {
  if (!socket || !socketConnected.value) return;
  socket.emit("ping_from_client", {
    client_time: Date.now(),
  });
  addMessage(`[心跳] 已发送 ping`);
}

/**
 * 添加消息到页面（自动限制条数）
 */
function addMessage(text: string) {
  messages.value.push(`[${new Date().toLocaleTimeString()}] ${text}`);
  if (messages.value.length > maxMessages) {
    messages.value.shift();
  }
}

// ---- 生命周期 ----

onMounted(() => {
  connectSocket();
});

onBeforeUnmount(() => {
  // 组件销毁时断开 Socket.IO 连接
  if (socket) {
    socket.disconnect();
    socket = null;
  }
});
</script>

<template>
  <main class="container">
    <!-- ============================================================ -->
    <!-- Tauri 原生通信 -->
    <!-- ============================================================ -->
    <h1>Pancake — 桌面工具箱</h1>

    <div class="row">
      <a href="https://vite.dev" target="_blank">
        <img src="/vite.svg" class="logo vite" alt="Vite logo" />
      </a>
      <a href="https://tauri.app" target="_blank">
        <img src="/tauri.svg" class="logo tauri" alt="Tauri logo" />
      </a>
      <a href="https://vuejs.org/" target="_blank">
        <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
      </a>
    </div>

    <form class="row" @submit.prevent="greet">
      <input id="greet-input" v-model="name" placeholder="Enter a name..." />
      <button type="submit">Greet</button>
    </form>
    <p>{{ greetMsg }}</p>

    <!-- ============================================================ -->
    <!-- Socket.IO 通信演示 -->
    <!-- ============================================================ -->
    <hr style="width: 80%; margin: 24px auto; border-color: #e0e0e0" />
    <h2>Socket.IO 测试面板</h2>

    <!-- 连接状态 -->
    <p>
      状态：
      <span :class="socketConnected ? 'status-on' : 'status-off'">{{ socketStatus }}</span>
    </p>

    <!-- 操作按钮 -->
    <div class="btn-group">
      <button type="button" :disabled="!socketConnected" @click="sendEcho">
        Echo 测试
      </button>
      <button type="button" :disabled="!socketConnected" @click="sendBroadcast">
        广播消息
      </button>
      <button type="button" :disabled="!socketConnected" @click="sendPing">
        心跳 Ping
      </button>
    </div>

    <!-- 消息日志 -->
    <div class="msg-log">
      <p v-for="(msg, i) in messages" :key="i" class="msg-line">{{ msg }}</p>
      <p v-if="messages.length === 0" class="msg-placeholder">暂无消息</p>
    </div>
  </main>
</template>

<style scoped>
.logo.vite:hover {
  filter: drop-shadow(0 0 2em #747bff);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #249b73);
}

/* Socket.IO 状态指示 */
.status-on {
  color: #22c55e;
  font-weight: bold;
}
.status-off {
  color: #ef4444;
  font-weight: bold;
}

/* 按钮组 */
.btn-group {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 12px 0;
}
.btn-group button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 消息日志区域 */
.msg-log {
  width: 80%;
  max-width: 600px;
  margin: 12px auto;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  text-align: left;
  font-size: 13px;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
}
@media (prefers-color-scheme: dark) {
  .msg-log {
    background: #1a1a1a;
  }
}
.msg-line {
  margin: 0;
  font-family: monospace;
}
.msg-placeholder {
  color: #999;
  text-align: center;
}
</style>
<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color: #0f0f0f;
  background-color: #f6f6f6;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.container {
  margin: 0;
  padding-top: 5vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: 0.75s;
}

.logo.tauri:hover {
  filter: drop-shadow(0 0 2em #24c8db);
}

.row {
  display: flex;
  justify-content: center;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}

a:hover {
  color: #535bf2;
}

h1 {
  text-align: center;
}

h2 {
  text-align: center;
  margin: 0;
}

input,
button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: #0f0f0f;
  background-color: #ffffff;
  transition: border-color 0.25s;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

button {
  cursor: pointer;
}

button:hover {
  border-color: #396cd8;
}
button:active {
  border-color: #396cd8;
  background-color: #e8e8e8;
}

input,
button {
  outline: none;
}

#greet-input {
  margin-right: 5px;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }

  a:hover {
    color: #24c8db;
  }

  input,
  button {
    color: #ffffff;
    background-color: #0f0f0f98;
  }
  button:active {
    background-color: #0f0f0f69;
  }
}
</style>
