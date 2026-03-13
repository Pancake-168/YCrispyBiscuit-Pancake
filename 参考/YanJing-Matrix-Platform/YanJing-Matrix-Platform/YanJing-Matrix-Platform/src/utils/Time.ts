const pad2 = (value: number): string => String(value).padStart(2, '0')

/**
 * 统一时间格式化函数
 * 输入时间戳，输出格式化字符串
 */
export function formatTime(ts: number): string {
	const date = new Date(ts)
	const now = new Date()
	const isToday =
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth() &&
		date.getDate() === now.getDate()

	const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
	if (isToday) return time

	const datePart = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
	return `${datePart} `
}

// 格式化音频时长，返回 mm:ss 格式
export function formattedTime(t: number): string {
  if (!isFinite(t) || t < 0) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}