import { apiUrls } from "@/apiUrls"
import { useApiPagesStore } from "@/stores/ApiPage"
import type { ApiPage } from '@/types/ApiPage'



// 从后端获取 API 页面列表
async function fetchApiPages(): Promise<ApiPage[]> {
    const apiUrl = apiUrls.getApiPages
    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('从后端获取到的原始 API 页面数据:', data)
        return data as ApiPage[]
    } catch (error) {
        console.error("Fetch API pages failed:", error)
        return [] // 返回空数组，继续执行
    }
}

//获取 API 列表并存入 Pinia
export async function getApiPages() {
    const apiPagesStore = useApiPagesStore()
    try {
        const pages = await fetchApiPages()
        apiPagesStore.setPages(pages)
    } catch (error) {
        console.error("ProjectStart: 初始化 API 页面失败", error)
        apiPagesStore.clearPages()
        // 不抛出错误，继续执行
    }
}

// 停止 API 页面服务（清空数据）
export function stopApiPages() {
    const apiPagesStore = useApiPagesStore()
    apiPagesStore.clearPages()
}

