<template>
    <div class="nocobase-ui-form-block">
        <slot />
    </div>
</template>

<style scoped>
.nocobase-ui-form-block {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    border: var(--glass-border);
    background: var(--glass-bg);
}
</style>
