<template>
  <div class="not-found">
    <h1>{{ $t('notFound.title') }}</h1>
    <p>{{ $t('notFound.message') }}</p>
    <button @click="$router.push('/')" class="btn">{{ $t('notFound.goHome') }}</button>
  </div>
</template>

<script setup lang="ts">
</script>


<style scoped src="@/styles/Project/views/NotFound.css"></style>
