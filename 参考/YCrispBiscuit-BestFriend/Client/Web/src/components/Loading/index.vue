<template>
    <div class="loading-container">
        <img :src="Loading" alt="Loading..."  />
        <div class="loading-text" aria-label="加载中...">
            <span v-for="(ch, i) in chars" :key="i" :style="{ animationDelay: (i * 0.1) + 's' }">{{ ch }}</span>
        </div>
    </div>

</template>

<script lang="ts" setup>
import Loading from '@/assets/Loading.gif'
import { computed } from 'vue'

const loadingText = '加载中···'
const chars = computed(() => Array.from(loadingText))


</script>


<style scoped>
.loading-container {

    

    font-size: var(--font-size-title);
    font-weight: var(--font-weight-normal);

    display: flex;
    flex-direction: column;
    /* 垂直排列 */



    transform: translateY(35vh);
    /*距上方30vh*/

    align-items: center;
    /* 水平居中 */

    z-index: 1000;


}

.loading-text {
    display: inline-flex;
    gap: 0.1em;
    margin-top: 0.5rem;
}

.loading-text span {
    display: inline-block;
    animation: loading-jump 1.2s ease-in-out infinite;
    transform-origin: bottom center;
}

@keyframes loading-jump {

    0%,
    100% {
        transform: translateY(0);
        opacity: 1;
    }

    30% {
        transform: translateY(-0.35em);
    }

    60% {
        transform: translateY(0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .loading-text span {
        animation: none;
    }
}
</style>