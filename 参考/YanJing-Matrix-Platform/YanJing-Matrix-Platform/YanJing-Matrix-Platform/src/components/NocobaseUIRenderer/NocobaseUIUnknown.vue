<template>
    <div class="nocobase-ui-unknown">
        <slot>Unknown component</slot>
    </div>
</template>

<style scoped>
.nocobase-ui-unknown {
    padding: var(--space-sm);
    border: 1px dashed var(--text-muted);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: var(--font-base);
}
</style>
