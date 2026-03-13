<template>
    <form class="nocobase-ui-form" @submit.prevent>
        <slot />
    </form>
</template>

<style scoped>
.nocobase-ui-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}
</style>
