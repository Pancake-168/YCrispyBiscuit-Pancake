<template>
  <div class="markdown-test-page">
    <div class="test-header">
      <h1>🧪 Vue-Markdown 渲染器测试</h1>
      <p>测试 Element 风格的 CommonMark 渲染器</p>
    </div>

    <div class="test-grid">
      <!-- 测试区域 1: 基础 Markdown -->
      <div class="test-card">
        <h3>📝 基础 Markdown 测试</h3>
        <MessageMarkdown 
          :content="basicMarkdown"
          @mention-user="handleMention"
        />
      </div>

      <!-- 测试区域 2: Matrix 协议 -->
      <div class="test-card">
        <h3>🔗 Matrix 协议测试</h3>
        <MessageMarkdown 
          :content="matrixMarkdown"
          @mention-user="handleMention"
        />
      </div>

      <!-- 测试区域 3: 代码块 -->
      <div class="test-card">
        <h3>💻 代码块测试</h3>
        <MessageMarkdown 
          :content="codeMarkdown"
          @mention-user="handleMention"
        />
      </div>

      <!-- 测试区域 4: 复杂内容 -->
      <div class="test-card">
        <h3>🎨 复杂内容测试</h3>
        <MessageMarkdown 
          :content="complexMarkdown"
          @mention-user="handleMention"
        />
      </div>

      <!-- 测试区域 5: 流式渲染 -->
      <div class="test-card">
        <h3>⚡ 流式渲染测试</h3>
        <MessageMarkdown 
          :content="streamContent"
          :stream-mode="true"
          :stream-delay="30"
          @stream-complete="handleStreamComplete"
        />
        <button @click="restartStream" class="restart-btn">重新播放</button>
      </div>

      <!-- 测试区域 6: 独立渲染器 -->
      <div class="test-card">
        <h3>🎯 独立渲染器测试</h3>
        <MarkdownRenderer 
          :content="basicMarkdown"
          :external-links="false"
          @mention-user="handleMention"
        />
      </div>
    </div>

    <!-- 事件日志 -->
    <div class="event-log">
      <h3>📋 事件日志</h3>
      <div class="log-content">
        <div v-for="(log, index) in eventLogs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-type">{{ log.type }}</span>
          <span class="log-data">{{ log.data }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MessageMarkdown from './MessageMarkdown/Markdown.vue'
import { MarkdownRenderer } from './Vue-Markdown'

const eventLogs = ref<Array<{ time: string, type: string, data: string }>>([])

const basicMarkdown = `# Hello World

这是一个**粗体**和*斜体*的测试。

## 列表测试
- 项目 1
- 项目 2
- 项目 3

## 链接测试
访问 [GitHub](https://github.com) 或 https://example.com
`

const matrixMarkdown = `# Matrix 协议测试

## 用户提及
你好 @user:matrix.org 和 @alice:example.com

## 房间别名
加入房间: #general:matrix.org

## MXC 链接
图片地址: mxc://matrix.org/abc123xyz
`

const codeMarkdown = `# 代码测试

行内代码: \`const x = 42\`

代码块:
\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`
}

const user: User = {
  id: '@user:matrix.org',
  name: 'Test User',
  email: 'test@example.com'
}

console.log(greet(user))
\`\`\`

代码中的链接: https://github.com
`

const complexMarkdown = `# 复杂内容测试

## 表格

| 特性 | 支持 | 备注 |
|------|------|------|
| CommonMark | ✅ | 完整支持 |
| GFM | ✅ | 表格、删除线 |
| Matrix | ✅ | @用户、#房间 |

## 引用

> 这是一段引用
> 支持多行
> 
> 还可以有段落

## 混合内容

**提及用户**: @bob:matrix.org 可以访问 https://matrix.org

代码示例:
\`\`\`javascript
// 连接到 Matrix 服务器
const client = sdk.createClient({
  baseUrl: "https://matrix.org"
})
\`\`\`

---

## 任务列表

- [x] 实现 CommonMark 解析
- [x] 实现 Matrix 协议支持
- [x] 实现 @ 提及功能
- [ ] 添加语法高亮
- [ ] 添加数学公式支持
`

const streamContent = ref('')
const streamText = `# 流式渲染演示

这是一段**流式渲染**的文本。

每个字符都会逐个显示，就像打字机一样。

## 代码也可以流式显示

\`\`\`javascript
console.log('Hello, World!')
\`\`\`

## 链接和提及

访问 https://matrix.org 或提及 @user:matrix.org
`

let streamInterval: number | null = null

const startStream = () => {
  streamContent.value = streamText
}

const restartStream = () => {
  streamContent.value = ''
  if (streamInterval) {
    clearTimeout(streamInterval)
  }
  streamInterval = setTimeout(() => {
    streamContent.value = streamText
  }, 100) as unknown as number
}

const handleMention = (userId: string, displayName: string) => {
  eventLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    type: '👤 提及用户',
    data: `${displayName} (${userId})`
  })
}

const handleStreamComplete = () => {
  eventLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    type: '⚡ 流式渲染',
    data: '渲染完成'
  })
}

// 启动流式渲染
startStream()
</script>

<style scoped>
.markdown-test-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: var(--bg-color, #f5f5f5);
  min-height: 100vh;
}

.test-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-header h1 {
  margin: 0 0 8px 0;
  color: #1890ff;
}

.test-header p {
  margin: 0;
  color: #666;
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.test-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.test-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.test-card h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  border-bottom: 2px solid #1890ff;
  padding-bottom: 8px;
}

.restart-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.restart-btn:hover {
  background: #40a9ff;
}

.event-log {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-log h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  border-bottom: 2px solid #52c41a;
  padding-bottom: 8px;
}

.log-content {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  font-family: 'Consolas', monospace;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #999;
  min-width: 80px;
}

.log-type {
  color: #1890ff;
  font-weight: 600;
  min-width: 120px;
}

.log-data {
  color: #333;
  flex: 1;
  word-break: break-all;
}
</style>
