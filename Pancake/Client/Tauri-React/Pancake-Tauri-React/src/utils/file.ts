/** 格式化文件大小为可读字符串。 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 格式化为 H:MM:SS / M:SS / 0:SS，始终补零。 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const s = Math.floor(seconds % 60);         // 秒余数
  const m = Math.floor(seconds / 60) % 60;    // 分钟（进位到小时后取余）
  const h = Math.floor(seconds / 3600);       // 小时
  const ss = String(s).padStart(2, '0');      // 秒补零
  if (h > 0) {
    const mm = String(m).padStart(2, '0');    // 分钟补零
    return `${h}:${mm}:${ss}`;                // H:MM:SS
  }
  return `${m}:${ss}`;                        // M:SS
}
