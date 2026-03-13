/**
 * 服务器列表（硬编码）。
 * 来源：.env.development / .env.production 当前已启用地址。
 */

import type {NocoBaseServerOption } from '@/types/NocoBase/client'


export const NOCOBASE_SERVER_OPTIONS: NocoBaseServerOption[] = [
    {
        key: 'dev-direct',
        label: '开发环境代理 (/nocobase-proxy/api)',
        baseURL: '/nocobase-proxy/api',
    },
    {
        key: 'prod-direct',
        label: '生产环境直连 (db.zheshu.tech)',
        baseURL: 'https://db.zheshu.tech/api',
    },
]