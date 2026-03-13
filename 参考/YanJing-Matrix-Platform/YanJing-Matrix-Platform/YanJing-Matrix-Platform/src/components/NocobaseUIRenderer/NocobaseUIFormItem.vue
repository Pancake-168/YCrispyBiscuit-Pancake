<template>
    <div class="nocobase-ui-form-item">
        <slot />
    </div>
</template>

<style scoped>
.nocobase-ui-form-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}
</style>
