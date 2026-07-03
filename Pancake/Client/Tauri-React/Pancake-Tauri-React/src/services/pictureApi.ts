/**
 * 图片转换 API 调用封装。
 *
 * 所有与 FastAPI 后端 /api/picture/* 的通信集中在此文件。
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface FormatDetail {
  extensions: string[];
  mime_type: string;
  supports_transparency: boolean;
  supports_animation: boolean;
  lossy_options: boolean;
  quality_range: [number, number] | null;
}

export interface FormatsResponse {
  input_formats: string[];
  output_formats: string[];
  format_details: Record<string, FormatDetail>;
}

export interface ConvertParams {
  target_format: string;
  quality?: number;
  lossless?: boolean;
  resize_mode?: 'none' | 'fit' | 'fill' | 'exact';
  max_width?: number;
  max_height?: number;
  width?: number;
  height?: number;
  keep_aspect_ratio?: boolean;
  background_color?: string;
  color_mode?: 'auto' | 'RGB' | 'RGBA' | 'L' | 'P';
  strip_metadata?: boolean;
}

export interface ConvertResultItem {
  index: number;
  original_name: string;
  converted_name: string;
  original_format: string;
  target_format: string;
  original_size: number;
  converted_size: number;
  original_resolution: string;
  converted_resolution: string;
  size_ratio: number;
  status: 'success' | 'error';
  error: string | null;
}

export interface ConvertResponse {
  task_id: string;
  total: number;
  results: ConvertResultItem[];
  zip_url: string | null;
}

// ============================================================================
// 常量
// ============================================================================

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

/** 单文件最大 100MB */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

// ============================================================================
// API 函数
// ============================================================================

/** 获取后端支持的格式列表。 */
export async function getFormats(): Promise<FormatsResponse> {
  const res = await fetch(`${API_BASE}/api/picture/formats`);
  if (!res.ok) {
    throw new Error(`获取格式列表失败: ${res.status}`);
  }
  return res.json();
}

/** 批量转换图片。 */
export async function convertPictures(
  files: File[],
  params: ConvertParams,
): Promise<ConvertResponse> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const entries = Object.entries(params) as [string, unknown][];
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  const res = await fetch(`${API_BASE}/api/picture/convert`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `转换请求失败: ${res.status}`);
  }

  return res.json();
}

/** 获取单个文件下载 URL。 */
export function getSingleDownloadUrl(taskId: string, index: number): string {
  return `${API_BASE}/api/picture/download/single/${taskId}/${index}`;
}

/** 获取批量 zip 下载 URL。 */
export function getBatchDownloadUrl(taskId: string): string {
  return `${API_BASE}/api/picture/download/batch/${taskId}`;
}

// ============================================================================
// 工具函数
// ============================================================================

/** 格式化文件大小为可读字符串。 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 过滤前端本地不支持的文件（扩展名 + 大小）。
 * supportedExtensions 应来自后端 /api/picture/formats 的 input_formats 字段，
 * 避免前端硬编码格式列表导致与后端不同步。
 */
export function filterSupportedFiles(
  files: File[],
  supportedExtensions: string[],
): {
  valid: File[];
  rejected: { name: string; reason: string }[];
} {
  const valid: File[] = [];
  const rejected: { name: string; reason: string }[] = [];

  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (supportedExtensions.length > 0 && !supportedExtensions.includes(ext)) {
      rejected.push({ name: f.name, reason: `不支持的格式 .${ext}` });
      continue;
    }
    if (f.size > MAX_FILE_SIZE) {
      rejected.push({ name: f.name, reason: '文件超过 100MB' });
      continue;
    }
    valid.push(f);
  }

  return { valid, rejected };
}
