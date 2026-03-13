/**
 * 字符串前后缀处理工具函数
 */

/**
 * 添加前后缀（如果不存在则添加）
 * @param str 原字符串
 * @param prefix 前缀
 * @param suffix 后缀
 * @returns 确保有前后缀的字符串
 */
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

/**
 * 移除前后缀（如果存在则移除）
 * @param str 原字符串
 * @param prefix 前缀
 * @param suffix 后缀
 * @returns 移除前后缀后的字符串
 */
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
