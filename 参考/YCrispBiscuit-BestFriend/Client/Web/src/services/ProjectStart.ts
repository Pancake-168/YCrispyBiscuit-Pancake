import { getApiPages , stopApiPages} from "@/services/project/ApiPage"
import { getCalendarEvents ,stopCalendarEvents} from "@/services/project/Calendar"




// 启动序列
export async function ProjectStart() {

    // 获取 API 页面列表
    await getApiPages()
    await getCalendarEvents()
}



export async function ProjectStop() {
    // 停止 API 页面服务
    stopApiPages()
    // 停止日历事件服务
    stopCalendarEvents()

}



