<template>
    <div class="nocobase-ui-grid">
        <slot />
    </div>
</template>

<style scoped>
.nocobase-ui-grid {
    display: grid;
    gap: var(--space-md);
    width: 100%;
}
</style>
