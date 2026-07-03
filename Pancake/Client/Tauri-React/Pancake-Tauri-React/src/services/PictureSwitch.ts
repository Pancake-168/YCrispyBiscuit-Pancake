import { createLogger } from '@/utils/logger';
import { API_URLS } from '@/ApiUrls';
import type { ApiResult } from '@/types/api';






export interface FormatsResponse {
    input_formats: string[];
    output_formats: string[];
    format_details: Record<string, FormatDetail>;
}

export interface FormatDetail {
    extensions: string[];
    mime_type: string;
    supports_transparency: boolean;
    supports_animation: boolean;
    lossy_options: boolean;
    quality_range: [number, number] | null;
}

// 获取支持的格式列表
export async function getFormats(): Promise<ApiResult<FormatsResponse>> {
    const log = createLogger('PictureSwitch.ts', 'getFormats');
    let error: string | undefined;
    try {
        log.info('开始获取支持的格式列表');
        const res = await fetch(API_URLS.getFormats(), {
            method: 'GET',
            headers: { accept: 'application/json' },
        });
        if (res.ok) {
            const data = await res.json() as FormatsResponse;
            log.info('获取支持的格式列表成功', data);
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;
    } catch (e) {
        log.error('获取支持的格式列表失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '获取格式列表失败' };
}




export interface ConvertParams {
    // 目标类型
    target_format: string;
    // 质量参数
    quality?: number;
    // 无损参数
    lossless?: boolean;
    // 调整大小模式
    resize_mode?: 'none' | 'fit' | 'fill' | 'exact';
    max_width?: number;
    max_height?: number;
    width?: number;
    height?: number;
    // 是否保持宽高比
    keep_aspect_ratio?: boolean;
    // 背景颜色
    background_color?: string;
    color_mode?: 'auto' | 'RGB' | 'RGBA' | 'L' | 'P';
    // 是否去除元数据
    strip_metadata?: boolean;
}

export interface ConvertResultItem {
    index: number;
    // 原始文件名
    original_name: string;
    // 转换后的文件名
    converted_name: string;
    original_format: string;
    target_format: string;
    original_size: number;
    converted_size: number;
    // 原始分辨率
    original_resolution: string;
    converted_resolution: string;
    // 文件大小比率
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


// 批量转换图片
// 注意返回值里面的 error: string | null ，意味着每个文件的转换结果可能是成功或失败
export async function convertPictures(files: File[], params: ConvertParams): Promise<ApiResult<ConvertResponse>> {
    const log = createLogger('PictureSwitch.ts', 'convertPictures');
    let error: string | undefined;
    // 构建 FormData
    const formData = new FormData();

    // 将文件添加到 FormData 中
    files.forEach((f) => formData.append('files', f));

    // 将 params 对象的属性添加到 FormData 中
    // Object.entries函数将对象的可枚举属性转换为一个键值对数组，返回一个二维数组，每个元素都是一个[key, value]形式的数组
    const entries = Object.entries(params) as [string, unknown][];
    for (const [key, value] of entries) {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    }

    try {
        log.info('开始转换图片');
        const res = await fetch(API_URLS.convertPictures(), {
            method: 'POST',
            headers: { accept: 'application/json' },
            body: formData,
        });
        if (res.ok) {
            const data = await res.json() as ConvertResponse;
            log.info('转换图片成功', data);
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;
    } catch (e) {
        log.error('转换图片失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '转换图片失败' };
}





// 单个文件下载
export function getSingleDownloadUrl(taskId: string, index: number): string {
    return API_URLS.getSingleDownloadUrl(taskId, String(index));
}

// 批量打包下载
export function getBatchDownloadUrl(taskId: string): string {
    return API_URLS.getBatchDownloadUrl(taskId);
}



/**
 * 过滤前端本地不支持的文件（扩展名 + 大小）。
 * supportedExtensions 应来自后端 /api/picture/formats 的 input_formats 字段，
 * 避免前端硬编码格式列表导致与后端不同步。
 */

 /** 单文件最大 100MB */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

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