<template>
  <div class="header-search" role="button" tabindex="0" aria-label="打开全局搜索" @click="openDialog"
    @keydown.enter.prevent="openDialog" @keydown.space.prevent="openDialog">
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
      <div class="search-input">搜索</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { openTheBestSearch } from './open'

function openDialog() {
  openTheBestSearch()
}
</script>

<style scoped>
.header-search {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
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
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-md) 0 calc(var(--space-lg) + var(--space-xs));
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
  color: var(--text-muted);
  font-size: var(--font-xs);
  text-align: left;
  cursor: pointer;
}

.header-search:hover .search-input,
.header-search:focus-visible .search-input {
  border-color: color-mix(in srgb, var(--primary-color) 25%, transparent);
  background: color-mix(in srgb, var(--primary-color) 10%, var(--glass-bg));
  color: var(--text-color);
  outline: none;
}
</style>
