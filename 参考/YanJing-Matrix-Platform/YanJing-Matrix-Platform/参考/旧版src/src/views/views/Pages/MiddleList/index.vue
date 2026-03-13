<template>
  <div class="middle-list-container">
  <!-- 头部组件（内部直接调用 openTheBestSearch，全局统一） -->
  <Header :user-id="userId" />
    <div class="list-content">
      <RoomList 
        v-if="currentFunction === 'rooms'"
        :current-room-id="currentRoomId"
        :rooms="rooms"
        @select-room="$emit('select-room', $event)"
        @join-room="$emit('join-room', $event)" 
        @refresh-rooms="$emit('refresh-rooms')"
        @open-room-manager="$emit('open-room-manager', $event)"
        @open-global-manager="$emit('open-global-manager')"
        @open-space-manager="$emit('open-space-manager')"
        @space-changed="$emit('space-changed', $event)"
        @create-room="$emit('create-room', $event)"
      />
     
     

      <!--NewOrganizationList 
        v-if="currentFunction === 'organization'" 
        @card-action="$emit('organization-action', $event)"
        @add-new-organization="$emit('add-new-organization')"
        @talk-request-from-organization-list="onTalkRequestFromOrganizationList"
      /-->



    </div>
  </div>
</template>

<script setup lang="ts">
import Header from './Header'
import RoomList from './RoomList'

import NewOrganizationList from './NewOrganizationList'

interface Props {
  userId: string
  currentRoomId: string
  rooms: any[]
  currentFunction: string
}

defineProps<Props>()

const emit = defineEmits<{
  'select-room': [roomId: string]
  'join-room': [roomIdOrAlias: string]
  'refresh-rooms': []
  'open-room-manager': [room: any]
  'open-global-manager': []
  'open-space-manager': []
  'add-new-organization': []
  'organization-action': [event: any]
  'agent-select': [agent: any]
  'space-changed': [spaceId: string]
  'create-room': [spaceId: string]
  'talk-request-from-organization-list': [userid: string, createdRoomId?: string]
}>()

// 转发组织组件的对话请求（兼容多个参数）
const onTalkRequestFromOrganizationList = (...args: any[]) => {
  // 直接把所有参数原样透传给上层
  // @ts-ignore
  emit('talk-request-from-organization-list', ...args)
}
</script>

<style scoped>
.middle-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-third);
}

.list-content {
  flex: 1;
  overflow-y: auto;
  background-color: var(--bg-color-third);
}
</style>
