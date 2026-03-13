import * as sdk from 'matrix-js-sdk'
import type { IStore } from 'matrix-js-sdk/lib/store'

export interface MatrixIndexedDBStoreOptions {
    /**
     * 自定义 dbName。建议按 homeserver + userId 生成，避免切号串库。
     */
    dbName: string

    /**
     * 可选：用于更细粒度区分（如 deviceId / profileId）。会拼到 dbName 后面。
     */
    namespace?: string
}

function isBrowserRuntime(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
}

function buildDbName(options: MatrixIndexedDBStoreOptions): string {
    const suffix = options.namespace ? `_${options.namespace}` : ''
    return `${options.dbName}${suffix}`
}

/**
 * 创建并初始化 matrix-js-sdk 的 IndexedDBStore（Web / Electron renderer 可用）。
 * - 不会在 Node/Electron main 中触发引用错误（会返回 null）。
 * - 注意：IndexedDBStore.startup() 必须在 store 被分配给 client 之后调用。
 */
export async function createMatrixIndexedDBStore(
    options: MatrixIndexedDBStoreOptions,
): Promise<IStore | null> {
    if (!isBrowserRuntime()) return null

    const IndexedDBStoreCtor = (sdk as unknown as { IndexedDBStore?: unknown }).IndexedDBStore as
        | (new (args: unknown) => IStore & { startup?: () => Promise<void> })
        | undefined

    if (!IndexedDBStoreCtor) {
        // 兼容：如果未来 SDK 变更导出名，调用方可选择降级为内存 store
        return null
    }

    const dbName = buildDbName(options)

    // matrix-js-sdk 的 IndexedDBStore 通常需要显式传入 indexedDB/localStorage
    // 以便在不同运行环境保持一致行为。
    const store = new IndexedDBStoreCtor({
        indexedDB: window.indexedDB,
        localStorage: window.localStorage,
        dbName,
    })

    return store
}

/**
 * 清理（删除）指定 dbName 的 IndexedDB 数据库。
 * 仅在浏览器/Electron renderer 环境可用。
 */
export async function deleteMatrixIndexedDBDatabase(dbName: string): Promise<boolean> {
    if (!isBrowserRuntime()) return false

    return await new Promise<boolean>((resolve) => {
        try {
            const req = window.indexedDB.deleteDatabase(dbName)
            req.onsuccess = () => resolve(true)
            req.onerror = () => resolve(false)
            req.onblocked = () => resolve(false)
        } catch {
            resolve(false)
        }
    })
}

/**
 * 尝试通过 store 自身提供的清理能力删除数据；若不可用则回退到 deleteDatabase。
 */
export async function clearMatrixStoreOrDeleteDb(params: {
    store: IStore | null
    dbName: string
}): Promise<boolean> {
    if (!isBrowserRuntime()) return false

    const { store, dbName } = params
    const maybe = store as (IStore & { deleteAllData?: () => Promise<void> }) | null

    if (maybe && typeof maybe.deleteAllData === 'function') {
        try {
            await maybe.deleteAllData()
            return true
        } catch {
            // fall through
        }
    }

    return await deleteMatrixIndexedDBDatabase(dbName)
}
