<template>
    <div class="UserInfo">
        <img class="avatar" src="@/assets/icon.png" alt="avatar" />
        <span class="username">依酥饼</span>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.UserInfo {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    background-color: var(--bg-secondary);
    padding-top: 1rem;
    padding-bottom: 1rem;
    padding-left:  1.5rem;
    padding-right: 1.5rem;
    align-items: center;
   
}

.avatar {

    min-width: 45px;
    aspect-ratio: 1/1;
    border-radius: 50%;
}

.username {
    font-size: var(--font-size-title);
    font-weight: var(--font-weight-bold);
}
</style>