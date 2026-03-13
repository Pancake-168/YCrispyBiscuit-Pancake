<template>
  <div class="chat-view">
    <div class="chat-layout" :class="{ 'chat-layout--focus': focusModeActive }">
      <!-- 
      <aside v-if="focusModeActive" class="chat-layout__side">
        <SystemList2 />
      </aside>
      -->

      <div class="chat-layout__main">
        <RoomStatusIndicator
          :room-id="currentRoomIdForStatus"
          :membership-status="membershipStatus"
          @status-changed="handleStatusChanged"
        >
          <template v-if="membershipStatus === 'join'">
            <ChatHeader />
            <MessageArea
              :messages="messages || []"
              :current-user-id="currentUserId || ''"
              :room-id="currentRoomId?.value"
              @mention-user="handleMentionUser"
            />
            <InputArea ref="inputAreaRef" :sending="currentSending" @send-message="handleSendMessage" />
          </template>
        </RoomStatusIndicator>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import ChatHeader from './ChatHeader/index.vue'
import MessageArea from './MessageArea/index.vue'
import InputArea from './InputArea/index.vue'
import RoomStatusIndicator from './RoomStatusIndicator/index.vue'
import { roomServiceV2 } from '@/services/matrix/rooms'
// import SystemList2 from '@/views/views/Pages/NewRightContent/NewRightContentList/SystemList2/index.vue'
import { useAssistantSidebarStore } from '@/stores/assistantSidebar'

interface Props {
  agentID?: string
  applicationId?: string
}

const props = defineProps<Props>()

const chatContext = inject('chatContext') as any

if (!chatContext) {
  console.error('chatContext not found! Make sure the parent component provides it.')
}

const {
  currentRoomId,
  roomName,
  sending,
  messages,
  currentUserId,
  sendMessage
} = chatContext || {}

console.log('Chat component - chatContext data:', {
  currentRoomId: currentRoomId?.value,
  roomName: roomName?.value,
  hasMessages: !!messages,
  messagesLength: messages?.value?.length || 0,
  currentUserId: currentUserId?.value,
  hasSendMessage: !!sendMessage,
  props: props
})

const membershipStatus = ref<string | null>(null)
const currentRoomIdForStatus = ref<string | undefined>(undefined)
const inputAreaRef = ref<any>(null)

type ChatInputController = {
  setText: (text: string) => void
}

const registerChatInputController = inject<((controller: ChatInputController | null) => void) | null>(
  'registerChatInputController',
  null
)

const tryRegisterChatInputController = () => {
  if (!registerChatInputController) return
  if (!inputAreaRef.value) return
  registerChatInputController({
    setText: (text: string) => {
      if (inputAreaRef.value?.setText) {
        inputAreaRef.value.setText(text)
      } else {
        console.warn('[NewChat] InputArea.setText is not available')
      }
    },
  })
}

watch(membershipStatus, (newStatus) => {
  console.log('Chat组件 - membershipStatus变化:', {
    newStatus,
    shouldShowChatHeader: newStatus === 'join'
  })
})

const currentSending = computed(() => sending?.value || false)

const checkRoomStatus = () => {
  if (currentRoomId?.value) {
    const status = roomServiceV2.获取用户房间状态(currentRoomId.value)
    membershipStatus.value = status
    currentRoomIdForStatus.value = currentRoomId.value
  } else {
    membershipStatus.value = null
    currentRoomIdForStatus.value = undefined
  }
}

const handleMentionUser = (userId: string, displayName: string) => {
  console.log('Chat handleMentionUser:', { userId, displayName })
  if (inputAreaRef.value && inputAreaRef.value.insertMention) {
    inputAreaRef.value.insertMention(displayName, userId)
  }
}

const handleSendMessage = async (
  messageData: { plainText: string; htmlText: string; hasMentions: boolean },
  replyToEventId?: string
) => {
  console.log('Chat handleSendMessage called:', {
    messageData,
    replyToEventId,
    membershipStatus: membershipStatus.value,
    hasSendMessage: !!sendMessage,
    currentRoomId: currentRoomId?.value
  })

  if (sendMessage && membershipStatus.value === 'join') {
    await sendMessage(messageData, replyToEventId)
  } else {
    console.warn('无法发送消息:', {
      membershipStatus: membershipStatus.value,
      hasSendMessage: !!sendMessage
    })
  }
}

const handleStatusChanged = () => {
  checkRoomStatus()
  if (chatContext?.refreshRoomData) {
    chatContext.refreshRoomData()
  }
}

watch(
  () => currentRoomId?.value,
  (newRoomId) => {
    console.log('Chat组件 - 房间ID变化:', {
      newRoomId,
      roomName: roomName?.value,
      currentUserId: currentUserId?.value,
      membershipStatus: membershipStatus.value
    })

    console.log('传递给ChatHeader的数据:', {
      'room-name': roomName?.value || '',
      'room-id': currentRoomId?.value || '',
      'agent-i-d': props.agentID || '',
      'application-id': props.applicationId || ''
    })

    checkRoomStatus()
  },
  { immediate: true }
)

onMounted(() => {
  checkRoomStatus()
  tryRegisterChatInputController()
})

watch(
  () => inputAreaRef.value,
  () => {
    tryRegisterChatInputController()
  }
)

const assistantSidebarStore = useAssistantSidebarStore()
const { focusModeActive } = storeToRefs(assistantSidebarStore)
</script>

<style scoped>
.chat-view {
  background-color: var(--bg-color-fourth);
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  --chat-icon-color: var(--text-color-secondary, #565656);
  --chat-icon-color-hover: var(--color-primary, #5865f2);
  --chat-icon-bubble-bg: rgba(88, 101, 242, 0.12);
  --chat-send-icon-color: var(--color-primary, #5865f2);
  --chat-gradient-start: #d0bcff;
  --chat-gradient-end: #e3e3e3;
}

.chat-layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  gap: 0;
}

.chat-layout--focus {
  grid-template-columns: 240px minmax(0, 1fr);
}

.chat-layout__main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-layout__side {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-color-third);
  padding-top: 2vh;
  padding-right: 1vw;
}

.chat-layout__side {
  border-right: 1px solid var(--border-color);
}

:global([data-theme='light']) .chat-view {
  --chat-icon-color: var(--text-color-secondary, #565656);
  --chat-icon-color-hover: var(--color-primary, #4c51ff);
  --chat-icon-bubble-bg: rgba(88, 101, 242, 0.12);
  --chat-send-icon-color: var(--color-primary, #5865f2);
  --chat-gradient-start: #d0bcff;
  --chat-gradient-end: #e3e3e3;
}

:global([data-theme='dark']) .chat-view {
  --chat-icon-color: var(--text-color, #f5f7ff);
  --chat-icon-color-hover: var(--color-primary, #9ca6ff);
  --chat-icon-bubble-bg: rgba(112, 123, 255, 0.2);
  --chat-send-icon-color: #f5f7ff;
  --chat-gradient-start: #9fa8ff;
  --chat-gradient-end: #d4d8ff;
}

@media (max-width: 1280px) {
  .chat-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 1024px) {
  .chat-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .chat-layout--focus {
    grid-template-columns: minmax(0, 1fr);
  }

  .chat-layout__side {
    display: none;
  }
}

/* 调试相关样式保留 */
.dev-panel {
  background: #f0f0f0;
  border: 2px dashed #ccc;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
}

.dev-panel h4 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: calc(var(--font-size-sm) + 1px);
}

.dev-controls {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.dev-controls button {
  padding: 5px 10px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.dev-controls button:hover {
  background: #f5f5f5;
}

.dev-controls button.active {
  background: #007acc;
  color: white;
  border-color: #007acc;
}

.dev-controls button.close-dev {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
  margin-left: auto;
}

.dev-controls button.close-dev:hover {
  background: #c82333;
}

.dev-panel p {
  margin: 0;
  font-size: var(--font-size-xs);
  color: #666;
  font-family: monospace;
}

.dev-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #007acc;
  color: white;
  font-size: var(--font-size-lg);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.dev-toggle:hover {
  background: #005a9e;
  transform: scale(1.1);
}
</style>
