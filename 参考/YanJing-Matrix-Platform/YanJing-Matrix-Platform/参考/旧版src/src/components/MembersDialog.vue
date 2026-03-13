<template>
  <div v-if="visible" class="members-dialog-mask" @click.self="$emit('close')">
    <div class="members-dialog">
      <div class="members-dialog-header">
        <span>成员列表（{{ members.length }}）</span>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="members-dialog-list">
        <template v-for="member in members" :key="member.item.userId">
          <div class="members-dialog-item" @click="showUserProfileCard(member.item.userId)">
            <img v-if="member.item.avatarUrl" :src="member.item.avatarUrl" :alt="getDisplayName(member.item.userId, member.item.displayName)" class="members-dialog-avatar" />
            <div class="members-dialog-info">
              <div class="members-dialog-name">{{ getDisplayName(member.item.userId, member.item.displayName) }}</div>
              <div class="members-dialog-id">ID: {{ member.item.userId }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { showUserProfileCard } from '@/components/UserProfileCard/showUserProfileCard'
import { resolveUserDisplayName } from '@/utils/displayName'

const getDisplayName = (userId: string, matrixDisplayName?: string) =>
  resolveUserDisplayName({ matrixId: userId, matrixDisplayName: matrixDisplayName || null })
defineProps<{ visible: boolean; members: any[] }>();
defineEmits(['close']);
</script>

<style scoped>
.members-dialog-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.55);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}
.members-dialog {
    background:var(--bg-color-third);
    border-radius: 12px;
    border: 1px solid var(--text-color);
    min-width: 320px;
    max-width: 90vw;
    max-height: 80vh;
    overflow: auto;
    padding: 24px 20px 16px 20px;
    position: relative;
}
.members-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
}
.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #888;
    line-height: 1;
}
.members-dialog-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.members-dialog-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}
.members-dialog-item:hover {
  background-color:var(--bg-color);
}
.members-dialog-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    background: #eee;
}
.members-dialog-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 10px;
}
.members-dialog-name {
    font-size: 15px;
    font-weight: 500;
}
.members-dialog-id {
    font-size: 12px;
    color: #888;
}

.copy-btn {
  padding: 2px 10px;
  font-size: 12px;
  border: 1px solid #bbb;
  border-radius: 6px;
  background:var(--bg-color-secondary);
  color: var(--text-color);
  cursor: pointer;
  transition: background 0.18s;
}
.copy-btn:hover {
    background:var(--bg-color-secondary);
  color: var(--text-color);
  
}
</style>
