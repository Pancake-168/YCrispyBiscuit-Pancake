<template>
  <div class="dialog-overlay yj-dialog-mask" @click.self="closeDialog">
    <div class="dialog yj-dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>审批中心</h3>
        <div class="header-right">
          <button class="close-btn" @click="closeDialog">×</button>
        </div>
      </div>

      <div class="dialog-body">
        <!-- 顶部页签 -->
        <div class="tabs-header">
          <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key">
            {{ tab.label }}
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="tab-content">
          <!-- 待办列表 -->
          <KeepAlive>
            <TodoList v-if="activeTab === 'todo'" />
          </KeepAlive>

          <!-- 发起审批 -->
          <KeepAlive>
            <SubmitPanel v-if="activeTab === 'submit'" />
          </KeepAlive>

          <!-- 模板管理 -->
          <KeepAlive>
            <TemplatePanel v-if="activeTab === 'template'" />
          </KeepAlive>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 引入拆分后的子组件
import TodoList from './components/Todo/TodoList.vue'
import SubmitPanel from './components/Submit/SubmitPanel.vue'
import TemplatePanel from './components/Template/TemplatePanel.vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

// 状态
const activeTab = ref<'todo' | 'submit' | 'template'>('todo')

const tabs = [
  { key: 'todo', label: '我的待办' },
  { key: 'submit', label: '发起审批' },
  { key: 'template', label: '模板管理' }
] as const

function closeDialog() {
  emit('close')
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: color-mix(in srgb, var(--bg-color) 88%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
  padding: var(--space-md);
}

.dialog {
  background: var(--panel-bg);
  width: 90vw;
  height: 90vh;
  max-width: 1200px;
  min-height: 620px;
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
  overflow: hidden;
}

.dialog-header {
  padding: var(--space-md) var(--space-lg);
 
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: color-mix(in srgb, var(--bg-color) 82%, var(--panel-bg));
}

.dialog-header h3 {
  margin: 0;
  font-size: var(--font-md);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.user-switch {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.user-id-input {
  width: 92px;
  height: 30px;
  padding: 0 var(--space-sm);
  border-radius: var(--radius-sm);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: var(--font-sm);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-color);
}

.dialog-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs-header {
  padding: 1rem var(--space-lg);
  
  display: flex;
  gap: var(--space-xs);
  background: color-mix(in srgb, var(--bg-color) 78%, var(--panel-bg));
  overflow-x: auto;
}

.tab-btn {
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--font-sm);
  position: relative;
  transition: color 0.2s ease, background-color 0.2s ease;
  white-space: nowrap;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.tab-btn:hover {
  color: var(--text-color);
  background: var(--hover-bg);
}

.tab-btn.active {
  color: var(--active-color);
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--active-color);
}

.tab-content {
  flex: 1;
  overflow: hidden;
  padding: var(--space-md) var(--space-lg) var(--space-lg);
  background: var(--bg-color);
  position: relative;
}

@media (max-width: 900px) {
  .dialog {
    width: 96vw;
    height: 94vh;
    min-height: 0;
    border-radius: var(--radius-md);
  }

  .dialog-header {
    padding: var(--space-sm) var(--space-md);
  }

  .header-right {
    gap: var(--space-sm);
  }

  .tabs-header {
    padding: 0 var(--space-md);
  }

  .tab-content {
    padding: var(--space-sm) var(--space-md) var(--space-md);
  }
}
</style>
