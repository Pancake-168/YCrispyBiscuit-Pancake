<template>
    <input class="nocobase-ui-upload" type="file" :multiple="multiple" :disabled="disabled" />
</template>

<script setup lang="ts">
defineProps<{
    disabled?: boolean
    multiple?: boolean
}>()
</script>

<style scoped>
.nocobase-ui-upload {
    width: 100%;
    color: var(--text-color);
    font-size: var(--font-base);
}
</style>
