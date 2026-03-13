<template>
    <div class="YanJingAI2">
        <headpage />
        <bodypage v-if="!showBodies" />
        <bodies v-else :titleid="activeBodyId" />
        <footpage />
    </div>
</template>

<script setup lang="ts">
    import headpage from './headpage'
    import bodypage from './bodypage'
    import bodies from './bodies'
    import footpage from './footpage'
    import { computed } from 'vue'
    import { useRoute } from 'vue-router'

    const route = useRoute()
    const bodyIdFromPath = computed(() => {
        switch (route.path) {
            case '/opc':
                return 1
            case '/cua':
                return 2
            case '/custom':
                return 3
            default:
                return undefined
        }
    })

    const activeBodyId = computed(() => {
        if (bodyIdFromPath.value) return bodyIdFromPath.value
        const rawId = route.query.body ?? route.query.bodyId
        const id = Number(rawId)
        return [1, 2, 3].includes(id) ? id : 1
    })

    const showBodies = computed(() => {
        if (bodyIdFromPath.value) return true
        const rawId = route.query.body ?? route.query.bodyId
        const id = Number(rawId)
        return [1, 2, 3].includes(id)
    })
</script>


<style scoped>
.YanJingAI2 {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #FFFFFF;
    color: #000000;
    padding-top: 64px; /* HEAD 的高度 */
    overflow-y: auto; /* 强制允许垂直滚动 */
}

.YanJingAI2 :deep(p) {
    color: inherit;
}

@media (max-width: 768px) {
    .YanJingAI2 {
        padding-top: 56px; /* 移动端更窄的 Header */
    }
}
</style>
