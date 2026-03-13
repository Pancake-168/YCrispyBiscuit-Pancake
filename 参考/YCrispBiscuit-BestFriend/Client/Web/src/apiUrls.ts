const baseURL = import.meta.env.VITE_API_BASE as string;

export const apiUrls = { 
    
    //项目启动检查
    getHealthStatus: `${baseURL}/health`,

    //API的网页列表
    getApiPages: `${baseURL}/getApiPages`,

    //在线大语言模型网站
    getLLMOnline: `${baseURL}/getLLMOnline`,

    //sso登录
    ssoLogin: `${baseURL}/auth/login`,

    //sso注册
    ssoRegister: `${baseURL}/auth/register`,

    //系统信息的ws链接
    getSystemInfoWs: `${baseURL.replace("http", "ws").replace("/api", "")}/system-info`,

    // Calendar 相关 API
    getCalendarEvents: `${baseURL}/calendar/events/get`,
    deleteCalendarEvents: `${baseURL}/calendar/events/delete`,
    createOrUpdateCalendarEvent: `${baseURL}/calendar/events/createorupdate`,

}