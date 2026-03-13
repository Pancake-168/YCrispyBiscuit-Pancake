<template>
  <div class="not-found">
    <h1>{{ $t('notFound.title') }}</h1>
    <p>{{ $t('notFound.message') }}</p>
    <button @click="$router.push('/')" class="btn">{{ $t('notFound.goHome') }}</button>
  </div>
</template>

<script setup lang="ts">
</script>


<style scoped>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    justify-content: center;
    text-align: center;
    background: var(--bg-color);
    color: var(--text-color);
    padding: var(--space-xl);
  }
  
  h1 {
    margin-bottom: var(--space-sm);
  }
  
  p {
    margin-bottom: var(--space-lg);
  }
</style>
