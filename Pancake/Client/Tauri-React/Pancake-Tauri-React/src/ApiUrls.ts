export const API_BASE = import.meta.env.VITE_API_BASE;

export const API_URLS = {
  /**
   * Picture
   */

  // 获取后端支持的格式列表
  // get
  getFormats: () => `${API_BASE}/api/picture/formats`,

  // 批量转换图片
  // post
  convertPictures: () => `${API_BASE}/api/picture/convert`,

  // 获取单个文件下载
  // get
  getSingleDownloadUrl: (taskId: string, index: string) =>
    `${API_BASE}/api/picture/download/single/${taskId}/${index}`,

  // 获取批量下载
  // get
  getBatchDownloadUrl: (taskId: string) => `${API_BASE}/api/picture/download/batch/${taskId}`,

  /**
   * PCmethods
   */

  // 获取 MMD 工作流路径列表
  // get
  getMMDWorkflow: () => `${API_BASE}/api/pcmethods/getmmd`,

  // 打开所有 MMD 工作流文件夹
  // post
  openAllMMDFolders: () => `${API_BASE}/api/pcmethods/openmmd`,

  // 打开单个 MMD 工作流文件夹
  // post
  openSingleMMDFolder: (folderName: string) =>
    `${API_BASE}/api/pcmethods/openmmd/${encodeURIComponent(folderName)}`,

  /**
   * Audio
   */

  // 获取后端支持的音频格式列表
  // get
  getAudioFormats: () => `${API_BASE}/api/audio/formats`,

  // 批量转换音频
  // post
  convertAudio: () => `${API_BASE}/api/audio/convert`,

  // 获取单个音频文件下载
  // get
  getAudioSingleDownloadUrl: (taskId: string, index: string) =>
    `${API_BASE}/api/audio/download/single/${taskId}/${index}`,

  // 获取批量音频下载
  // get
  getAudioBatchDownloadUrl: (taskId: string) => `${API_BASE}/api/audio/download/batch/${taskId}`,

  /**
   * Weather
   */

  // 获取天气支持的城市 id+名称 列表
  // get
  getWeatherList: () => `${API_BASE}/api/weather/list`,

  // 获取单个城市天气
  // get
  getWeather: (id: string) => `${API_BASE}/api/weather?id=${encodeURIComponent(id)}`,
};
