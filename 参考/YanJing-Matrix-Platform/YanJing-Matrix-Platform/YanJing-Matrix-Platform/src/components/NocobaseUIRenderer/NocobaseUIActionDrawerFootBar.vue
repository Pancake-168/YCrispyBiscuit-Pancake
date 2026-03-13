<template>
    <div class="nocobase-ui-action-footbar">
        <slot />
    </div>
</template>

<style scoped>
.nocobase-ui-action-footbar {
    display: flex;
    gap: var(--space-md);
    justify-content: flex-end;
    padding-top: var(--space-md);
}
</style>
