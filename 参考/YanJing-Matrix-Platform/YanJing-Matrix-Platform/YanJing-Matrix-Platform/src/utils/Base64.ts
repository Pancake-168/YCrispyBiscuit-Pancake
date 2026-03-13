/**
 * 将任意 UTF-8 字符串编码为 Base64 字符串。
 *
 * 说明：
 * - 浏览器的 btoa/atob 只能处理“二进制字符串”（每个字符码点 0-255）。
 * - 这里先用 TextEncoder 把 UTF-8 文本变成字节数组，再拼成二进制字符串后交给 btoa。
 *
 * 典型用途：把 JSON 文本安全地放进 localStorage / URL 参数（不包含中文乱码/换行等）。
 */
export function base64EncodeUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  // 避免对超长字符串一次性 String.fromCharCode(...bytes) 造成调用栈/参数长度问题
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize))
  }
  return btoa(binary)
}

/**
 * 规范化 Base64 输入，使其可以被 atob 正确解码。
 *
 * 处理内容：
 * - 去除空白字符（换行/空格等）
 * - 兼容 base64url：把 '-'、'_' 转回 '+'、'/'
 * - 自动补齐 '=' padding（Base64 长度必须是 4 的倍数）
 */
export function normalizeBase64(input: string): string {
  // 兼容 base64url：-/_ 替换 +/，并补齐 padding
  let s = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad === 2) s += '=='
  else if (pad === 3) s += '='
  return s
}

/**
 * 将 Base64/Base64URL 字符串解码回 UTF-8 字符串。
 *
 * 说明：
 * - 先 normalizeBase64 兼容 base64url/padding
 * - 使用 atob 得到二进制字符串，再转 Uint8Array
 * - 最后用 TextDecoder 解出 UTF-8 文本
 */
export function base64DecodeUtf8(input: string): string {
  const normalized = normalizeBase64(input)
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}