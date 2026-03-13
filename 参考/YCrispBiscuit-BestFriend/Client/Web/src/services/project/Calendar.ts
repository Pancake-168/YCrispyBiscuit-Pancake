import { apiUrls } from "@/apiUrls"
import { useCalendarStore } from "@/stores/Calendar"
import type { CalendarEvent } from '@/types/CalendarData'

// 从后端获取日历事件列表
async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
    const apiUrl = apiUrls.getCalendarEvents
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
        console.log('从后端获取到的原始日历事件数据:', data)
        return data as CalendarEvent[]
    } catch (error) {
        console.error("Fetch calendar events failed:", error)
        return [] // 返回空数组，继续执行
    }
}

// 获取日历事件列表并存入 Pinia
export async function getCalendarEvents() {
    const calendarStore = useCalendarStore()
    try {
        const events = await fetchCalendarEvents()
        calendarStore.setEvents(events)
    } catch (error) {
        console.error("Calendar: 初始化日历事件失败", error)
        calendarStore.clearEvents()
        // 不抛出错误，继续执行
    }
}

// 停止日历事件服务（清空数据）
export function stopCalendarEvents() {
    const calendarStore = useCalendarStore()
    calendarStore.clearEvents()
}

// 创建或更新日历事件
export async function createOrUpdateCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
    const apiUrl = apiUrls.createOrUpdateCalendarEvent
    console.log('发送给后端的日历事件数据:', event)
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('从后端返回的创建/更新结果:', data)
        return data as CalendarEvent
    } catch (error) {
        console.error("Create or update calendar event failed:", error)
        return event // 返回原事件，继续执行
    }
}

// 删除日历事件
export async function deleteCalendarEvents(eventIds: string[]): Promise<number> {
    const apiUrl = apiUrls.deleteCalendarEvents
    try {
        const response = await fetch(apiUrl, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ event_ids: eventIds }),
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        return data as number // 返回删除的数量
    } catch (error) {
        console.error("Delete calendar events failed:", error)
        return 0 // 返回 0，继续执行
    }
}