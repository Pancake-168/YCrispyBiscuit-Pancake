import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ApiPage } from '@/types/ApiPage'




export const useApiPagesStore = defineStore('apiPages', () => {
    const pages = ref<ApiPage[]>([])
    function setPages(list: ApiPage[]) {
        pages.value = list
    }
    function clearPages() {
        pages.value = []
    }
    return { pages, setPages, clearPages }
})