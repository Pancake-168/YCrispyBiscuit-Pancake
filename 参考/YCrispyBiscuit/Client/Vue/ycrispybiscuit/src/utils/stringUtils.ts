


// 添加前缀和后缀的函数
export function addPrefixSuffix(str: string, prefix: string, suffix: string): string {

    if (!str) return str;
    
    let result = str;
    
    // 添加前缀（如果不存在）
    if (prefix && !result.startsWith(prefix)) {
        result = prefix + result;
    }
    
    // 添加后缀（如果不存在）
    if (suffix && !result.endsWith(suffix)) {
        result = result + suffix;
    }
    
    return result;
}

// 移除前缀和后缀的函数
export function removePrefixSuffix(str: string, prefix: string, suffix: string): string {
    if (!str) return str;
    
    let result = str;
    
    // 移除前缀（如果存在）
    if (prefix && result.startsWith(prefix)) {
        result = result.slice(prefix.length);
    }
    
    // 移除后缀（如果存在）
    if (suffix && result.endsWith(suffix)) {
        result = result.slice(0, -suffix.length);
    }
    
    return result;
}
