<template>
    <div class="nocobase-ui-grid-row">
        <slot />
    </div>
</template>

<style scoped>
.nocobase-ui-grid-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    width: 100%;
}
</style>
