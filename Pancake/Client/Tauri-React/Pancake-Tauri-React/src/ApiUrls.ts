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
};
