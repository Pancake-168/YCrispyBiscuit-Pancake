<template>
  <div class="middle-header">


    <div class="header-search">
      <div class="search-input-wrapper">
        <span class="search-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.6667 11.6666L14.6667 14.6666" stroke="#8C8C8C" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
            <path
              d="M13.3333 7.33337C13.3333 4.01967 10.647 1.33337 7.33333 1.33337C4.01962 1.33337 1.33333 4.01967 1.33333 7.33337C1.33333 10.6471 4.01962 13.3334 7.33333 13.3334C10.647 13.3334 13.3333 10.6471 13.3333 7.33337Z"
              stroke="#8C8C8C" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
        </span>
        <div class="search-input" @click="openTheBestSearch">搜索</div>
      </div>
    </div>


    <button @click="openUserList" class="create-btn">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="icon">
        <path
          d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12C22 13.1 21.1 14 20 14H14V20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20V14H4C2.9 14 2 13.1 2 12C2 10.9 2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" />
      </svg>
    </button>
  </div>
</template>


<script setup lang="ts">
import { openTheBestSearch } from '@/components/TheBestSearch/open'
import { openUserListDialog } from '@/components/UserListDialog/open'

const emit = defineEmits<{
  (e: 'talk-request-from-organization-list', userid: string, createdRoomId?: string): void
}>()

function openUserList() {
  openUserListDialog({
    onTalkRequest: (userid, createdRoomId) => {
      emit('talk-request-from-organization-list', userid, createdRoomId)
    }
  })
}
</script>



<style scoped>
.middle-header {
  width: 100%;
  padding: 8px;
  background-color: var(--bg-color-third);
  flex-shrink: 0;
  max-height: 40px;
  display: flex;
  align-items: center;
  gap:0.5rem;
}

.header-search {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 320px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 6px 16px 6px 36px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-color-secondary);
  color: var(--text-color);
  font-size: var(--font-size-base);
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
}


.create-btn {
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.2s ease;
}
</style>
