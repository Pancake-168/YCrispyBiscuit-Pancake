import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Page } from '@/types/Page'

export const usePageStore = defineStore('page', () => {
    const currentPage = ref<string>('Home')

    // 使用嵌套 JSON 架构
    const pages = ref<Page[]>([
        { id: 'Home', name: '首页' },
        {
            id: 'Calendar',
            name: '日历',
            children: [
                { id: 'CalendarView', name: '查看日历' },
                { id: 'CalendarAdd', name: '添加事件' }
            ]
        },
        {
            id: 'Tasks',
            name: '任务',
            children: [
                { id: 'Tasks-List', name: '任务列表' },
                { id: 'Tasks-Add', name: '添加任务' }
            ]
        },
        { id: 'LLM', name: 'LLM' },
        { id: 'Web', name: '网址' },
        { id: 'Tools', name: '工具' }
    ])

    // 计算属性：获取当前页面的面包屑路径
    // 递归查找目标页面的路径（从根到目标页面）
    async function findPathToPage(targetId: string): Promise<Page[] | null> {
        const search = (currentTree: Page[]): Page[] | null => {
            for (const p of currentTree) {
                if (p.id === targetId) return [p]
                if (p.children && p.children.length) {
                    const sub = search(p.children)
                    if (sub) return [p, ...sub]
                }
            }
            return null
        }
        return Promise.resolve(search(pages.value))
    }

    // 获取当前页面的面包屑路径（异步）
    async function getBreadcrumbs(): Promise<Page[]> {
        const path = await findPathToPage(currentPage.value)
        return path || []
    }

    // 获取页面的子页面（异步）
    async function getChildren(pageId: string): Promise<Page[]> {
        // 查找页面并返回其 children
        const find = (nodes: Page[], id: string): Page | undefined => {
            for (const n of nodes) {
                if (n.id === id) return n
                if (n.children) {
                    const r = find(n.children, id)
                    if (r) return r
                }
            }
            return undefined
        }
        const node = find(pages.value, pageId)
        return Promise.resolve(node?.children || [])
    }

    async function setCurrentPage(pageId: string): Promise<void> {
        currentPage.value = pageId
        return Promise.resolve()
    }

     function getPageName(id: string): string {
        return pages.value.find(p => p.id === id)?.name || id
    }

    return {
        currentPage,
        pages,
        getBreadcrumbs,
        getChildren,
        setCurrentPage,
        getPageName
    }
})