import { createLogger } from '@/utils/logger';
import { API_URLS } from '@/ApiUrls';
import type { ApiResult } from '@/types/ApiResult';

export interface PCmethodsFolder {
  name: string;
  path: string;
}

export interface PCmethodsWorkflow {
  name: string;
  folder: PCmethodsFolder[];
}

export async function getMMDWorkflow(): Promise<ApiResult<PCmethodsWorkflow>> {
  const log = createLogger('PCmethods.ts', 'getMMDWorkflow');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.getMMDWorkflow(), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as PCmethodsWorkflow;
      return { ok: true, data };
    }
    error = `HTTP ${res.status}`;
  } catch (e) {
    log.error('获取MMD工作流失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '获取MMD工作流失败' };
}

export async function openAllMMDFolders(): Promise<ApiResult<{ message: string }>> {
  const log = createLogger('PCmethods.ts', 'openAllMMDFolders');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.openAllMMDFolders(), {
      method: 'POST',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }
    error = `HTTP ${res.status}`;
  } catch (e) {
    log.error('打开MMD工作流文件夹失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '打开MMD工作流文件夹失败' };
}

export async function openSingleMMDFolder(
  folderName: string,
): Promise<ApiResult<{ message: string }>> {
  const log = createLogger('PCmethods.ts', 'openSingleMMDFolder');
  let error: string | undefined;
  try {
    const res = await fetch(API_URLS.openSingleMMDFolder(folderName), {
      method: 'POST',
      headers: { accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }
    error = `HTTP ${res.status}`;
  } catch (e) {
    log.error('打开单个MMD文件夹失败', e);
    error = String(e);
  }
  return { ok: false, data: null, error: error ?? '打开单个MMD文件夹失败' };
}
