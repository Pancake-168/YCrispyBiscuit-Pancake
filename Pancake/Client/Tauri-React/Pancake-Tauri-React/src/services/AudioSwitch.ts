import { createLogger } from '@/utils/logger'; // 前端日志工具
import { API_URLS } from '@/ApiUrls'; // 集中管理的 API 端点 URL
import type { ApiResult } from '@/types/ApiResult'; // 统一 API 返回包装类型（ok/data/error）
import { readHttpError } from '@/utils/http'; // 从非 2xx 响应中提取后端具体错误文案

// ============================================================================
// 类型定义 —— 与后端 AudioSwitchSchema.py 对齐
// ============================================================================

export interface FormatDetail {
  extensions: string[]; // 该格式的文件扩展名列表，如 [".m4a", ".aac"]
  mime_type: string; // MIME 类型，如 "audio/mpeg"
  lossy: boolean; // 是否是有损格式
}

export interface FormatsResponse {
  input_formats: string[]; // 不带点的输入扩展名列表
  output_formats: string[]; // 小写输出格式标识列表
  format_details: Record<string, FormatDetail>; // key=格式标识 value=FormatDetail
}

export interface ConvertResultItem {
  index: number; // 文件在批量中的序号（从 0 开始）
  original_name: string; // 原始文件名，如 "song.wav"
  converted_name: string; // 转换后文件名（失败时为空）
  original_format: string; // 原始格式标识，如 "wav"
  target_format: string; // 目标格式标识，如 "mp3"
  original_size: number; // 原始文件大小（字节）
  converted_size: number; // 转换后文件大小（字节）
  size_ratio: number; // 压缩比（0-1）
  duration_seconds: number; // 音频时长（秒）
  sample_rate: number; // 采样率（Hz），如 44100
  status: 'success' | 'error'; // 转换结果状态
  error: string | null; // 失败时的人类可读错误描述
  warning?: string | null; // 成功时的提示信息（如有损转无损不恢复音质），无提示为 null
}

export interface ConvertResponse {
  task_id: string; // 任务 ID（12 位 hex）
  total: number; // 总文件数
  results: ConvertResultItem[]; // 每个文件的转换结果
}

// ============================================================================
// API 调用
// ============================================================================

/** GET /api/audio/formats — 获取支持的音频格式列表 */
export async function getFormats(): Promise<ApiResult<FormatsResponse>> {
  const log = createLogger('AudioSwitch.ts', 'getFormats'); // 创建带上下文的 logger
  let error: string | undefined; // 预先声明 error，方便在 catch 和 else 中共用
  try {
    const res = await fetch(API_URLS.getAudioFormats(), {
      // 发送 GET 请求
      method: 'GET',
      headers: { accept: 'application/json' }, // 告诉后端期望 JSON 响应
    });
    if (res.ok) {
      // HTTP 2xx → 解析 JSON 并返回
      const data = (await res.json()) as FormatsResponse; // 类型断言
      return { ok: true, data };
    }
    error = await readHttpError(res); // 非 2xx → 取后端具体错误（如"不支持的目标格式"）
  } catch (e) {
    log.error('获取音频格式列表失败', e); // 网络异常等
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '获取音频格式列表失败' }; // 统一错误返回
}

/** POST /api/audio/convert — 批量音频转换 */
export async function convertAudio(
  files: File[], // 用户选中的文件列表
  targetFormat: string, // 目标格式标识，如 "mp3"
): Promise<ApiResult<ConvertResponse>> {
  const log = createLogger('AudioSwitch.ts', 'convertAudio');
  let error: string | undefined;
  const formData = new FormData(); // 构建 multipart/form-data 请求体
  files.forEach((f) => formData.append('files', f)); // 所有文件追加到同一个 files 字段
  formData.append('target_format', targetFormat); // 追加格式参数

  try {
    const res = await fetch(API_URLS.convertAudio(), {
      // 发送 POST 请求
      method: 'POST',
      headers: { accept: 'application/json' }, // 不设 Content-Type，浏览器自动带 boundary
      body: formData,
    });
    if (res.ok) {
      const data = (await res.json()) as ConvertResponse;
      return { ok: true, data };
    }
    error = await readHttpError(res);
  } catch (e) {
    log.error('音频转换失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '音频转换失败' };
}

/** 拼接单个文件下载 URL */
export function getSingleDownloadUrl(taskId: string, index: number): string {
  return API_URLS.getAudioSingleDownloadUrl(taskId, String(index));
}

/** 拼接批量 zip 下载 URL */
export function getBatchDownloadUrl(taskId: string): string {
  return API_URLS.getAudioBatchDownloadUrl(taskId);
}

// ============================================================================
// 文件过滤
// ============================================================================

/** 单文件最大 200MB */
export const MAX_FILE_SIZE = 200 * 1024 * 1024;

/** 前端本地过滤不支持的文件（扩展名 + 大小），减少无效上传 */
export function filterSupportedFiles(
  files: File[],
  supportedExtensions: string[], // 来自后端 getFormats() 的 input_formats 字段
): {
  valid: File[]; // 通过过滤的合法文件
  rejected: { name: string; reason: string }[]; // 被拒绝的文件及原因
} {
  const valid: File[] = [];
  const rejected: { name: string; reason: string }[] = [];

  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() || ''; // 提取扩展名并小写
    if (supportedExtensions.length > 0 && !supportedExtensions.includes(ext)) {
      // 白名单检查
      rejected.push({ name: f.name, reason: `不支持的格式 .${ext}` });
      continue; // 跳过此文件
    }
    if (f.size > MAX_FILE_SIZE) {
      // 大小上限检查
      rejected.push({ name: f.name, reason: '文件超过 200MB' });
      continue;
    }
    valid.push(f); // 通过全部检查
  }
  return { valid, rejected };
}
