<template>
  <div class="ycrispbiscuit-dropdown" :class="{ 'is-disabled': disabled }">
    <div class="dropdown-selected" @click="toggleDropdown">
      {{ selectedLabel }}
      <span class="dropdown-arrow">{{ isOpen ? '▲' : '▼' }}</span>
    </div>
    <ul v-if="isOpen" class="dropdown-list">
      <li v-for="option in options" :key="option.value" @click="selectOption(option)"
        :class="{ 'is-selected': option.value === modelValue }">
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Option {
  value: any;
  label: string;
}

const props = defineProps<{
  modelValue: string | number | undefined;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

const isOpen = ref(false);

const selectedLabel = computed(() => {
  if (!props.options || !Array.isArray(props.options)) return props.placeholder || '请选择';
  const option = props.options.find(o => o.value === props.modelValue);
  return option ? option.label : (props.placeholder || '请选择');
});

const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
};

const selectOption = (option: Option) => {
  emit('update:modelValue', option.value);
  isOpen.value = false;
};

const closeDropdown = () => {
  isOpen.value = false;
};

// 点击外部关闭
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.ycrispbiscuit-dropdown')) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.ycrispbiscuit-dropdown {
  position: relative;
  width: 120px;
  font-size: var(--font-size-small);
  border: 2px solid var(--border-default);
  border-radius: 5px;
  background-color: var(--bg-canvas);
}

.dropdown-selected {
  padding: 8px 12px;
  border: 2px solid var(--bg-canvas);
  font-size: var(--font-size-small);

  color: var(--fg-default);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}



.dropdown-arrow {
  font-size: 12px;
  padding-left: 1rem;
  color: var(--fg-default);
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-canvas);
  border: 2px solid var(--border-default);

  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-list li {
  padding: 8px 12px;
  cursor: pointer;
  color: var(--fg-default);
  transition: background 0.2s ease;
}

.dropdown-list li:hover {
  background: var(--bg-secondary);
}

.dropdown-list li.is-selected {
  background: var(--bg-secondary);
  font-weight: bold;
}

.ycrispbiscuit-dropdown.is-disabled .dropdown-selected {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>