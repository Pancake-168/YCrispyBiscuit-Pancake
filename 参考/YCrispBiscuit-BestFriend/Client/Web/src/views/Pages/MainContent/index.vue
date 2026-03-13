<template>
    <Home v-if="currentPage === 'Home'" />
    <Calendar v-if="currentPage === 'Calendar'" />
    <Tasks v-if="currentPage === 'Tasks'" />
    <LLM v-if="currentPage === 'LLM'" />
    <Web v-if="currentPage === 'Web'" />
    <Tools v-if="currentPage === 'Tools'" />
    <CalendarAdd v-if="pageStore.currentPage === 'CalendarAdd'" />


</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePageStore } from '@/stores/Page'
import Home from '@/views/Pages/MainContent/Home/index.vue'
import Calendar from '@/views/Pages/MainContent/Calendar/index.vue'
import Tasks from '@/views/Pages/MainContent/Tasks/index.vue'
import LLM from '@/views/Pages/MainContent/LLM/index.vue'
import Web from '@/views/Pages/MainContent/Web/index.vue'
import Tools from '@/views/Pages/MainContent/Tools/index.vue'
import CalendarAdd from '@/components/CalendarAndMissions/Operations/Create';


const pageStore = usePageStore()

const currentPage = computed(() => pageStore.currentPage)
</script>

<style scoped></style>