// Unified storage adapter for renderer
// - In Electron: uses ipcRenderer.invoke('settings-get'|'settings-set')
// - In Web: falls back to localStorage (with JSON serialization)

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
    // 使用 Preload 暴露的 electronAPI
    const api = (window as unknown as { electronAPI: import('@/types/electron').IElectronAPI }).electronAPI;
    if (api) {
        try {
            const val = await api.getSetting(key)
            // electron-store 在 key 不存在时通常返回 undefined。
            // 这时允许回退到 localStorage（兼容旧逻辑/迁移期数据）。
            if (val !== undefined && val !== null) return val as T
        } catch (error) {
            console.warn('Electron settings-get failed:', error)
        }
    }

    try {
        const v = localStorage.getItem(key)
        if (v === null) return null
        try {
            // Web 端自动解析 JSON
            return JSON.parse(v) as T
        } catch {
            return v as unknown as T
        }
    } catch {
        return null
    }
}

export async function setSetting(key: string, value: unknown): Promise<boolean> {
    const api = (window as unknown as { electronAPI: import('@/types/electron').IElectronAPI }).electronAPI;
    if (api) {
        try {
            // Electron 端的 electron-store 原生支持非字符串类型
            await api.setSetting(key, value)
            return true
        } catch (error) {
            console.warn('Electron settings-set failed:', error)
        }
    }

    try {
        // Web 端存储前进行 JSON 序列化，以支持对象、数组、布尔等
        const valToStore = typeof value === 'string' ? value : JSON.stringify(value)
        localStorage.setItem(key, valToStore)
        return true
    } catch {
        return false
    }
}

export async function removeSetting(key: string): Promise<boolean> {
    const api = (window as unknown as { electronAPI: import('@/types/electron').IElectronAPI }).electronAPI;
    if (api && 'removeSetting' in api && typeof api.removeSetting === 'function') {
        try {
            return await api.removeSetting(key)
        } catch (error) {
            console.warn('Electron settings-delete failed:', error)
        }
    }

    try {
        localStorage.removeItem(key)
        return true
    } catch {
        return false
    }
}

export async function getAllKeys(): Promise<string[]> {
    const api = (window as unknown as { electronAPI: import('@/types/electron').IElectronAPI }).electronAPI;
    if (api) {
        try {
            return await api.getAllKeys()
        } catch (error) {
            console.warn('Electron getAllKeys failed:', error)
        }
    }

    try {
        return Object.keys(localStorage)
    } catch {
        return []
    }
}
