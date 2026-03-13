import { apiUrls } from "@/apiUrls"
import { useSystemInfoStore } from "@/stores/SystemInfo"
import type { SystemInfo } from '@/types/SystemInfo'


// WebSocket 连接系统信息
let ws: WebSocket | null = null

function connectSystemInfoWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (ws) {
            resolve() // 已连接
            return
        }

        ws = new WebSocket(apiUrls.getSystemInfoWs)

        ws.onopen = () => {
            console.log('SystemInfo WebSocket connected')
            resolve()
        }

        ws.onmessage = (event) => {
            try {
                const data: SystemInfo = JSON.parse(event.data)
                const systemInfoStore = useSystemInfoStore()
                systemInfoStore.setSystemInfo(data)
            } catch (error) {
                console.error('Failed to parse SystemInfo WebSocket data:', error)
            }
        }

        ws.onclose = () => {
            console.log('SystemInfo WebSocket disconnected')
            ws = null
        }

        ws.onerror = (error) => {
            console.error('SystemInfo WebSocket error:', error)
            reject(error)
        }
    })
}

function disconnectSystemInfoWebSocket() {
    if (ws) {
        ws.close()
        ws = null
    }
}

// 获取系统信息（启动WebSocket连接）
export async function getSystemInfo(): Promise<void> {
    await connectSystemInfoWebSocket()
}

// 断开系统信息WebSocket
export function stopSystemInfo() {
    disconnectSystemInfoWebSocket()
    const systemInfoStore = useSystemInfoStore()
    systemInfoStore.clearSystemInfo()
}

