"""B站 WBI 签名模块。提供 mixin key 计算、WBI keys 获取和请求参数签名功能。"""

import hashlib  # MD5 签名
import time  # wts 时间戳
import urllib.parse  # URL 参数编码
from typing import Any

import httpx  # 同步 HTTP 客户端，用于获取 WBI keys

# ============================================================================
# 常量
# ============================================================================

# 统一 User-Agent，模拟 Chrome 浏览器
BILIBILI_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

# B站移动端 API 的固定 app key 和 secret（公开值，用于参数签名）
APP_KEY = "1d8b6e7d45233436"
APP_SEC = "560c52ccd288fed045859ed18bffd973"

# WBI 签名混排索引表：从原 key 按此顺序取 64 个字符中的前 32 个作为 mixin key
MIXIN_KEY_ENC_TAB = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
    27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
    37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
    22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 52, 44, 34,
]

# ============================================================================
# WBI keys 缓存（1 小时有效）
# ============================================================================

_wbi_cache: dict[str, Any] = {}  # 缓存的 WBI keys（img_key + sub_key）
_wbi_cache_time = 0  # 上次获取时间（Unix 秒）


# ============================================================================
# 公开函数
# ============================================================================


def get_mixin_key(orig: str) -> str:
    """根据混排表从原始 key 提取前 32 个字符作为 mixin key。"""
    return "".join(orig[i] for i in MIXIN_KEY_ENC_TAB)[:32]  # 按索引取字符，截取前 32 位


def sign_params(params: dict[str, Any]) -> dict[str, Any]:
    """对请求参数字典进行 WBI 签名，追加 wts 和 w_rid 字段。"""
    # 拼接 img_key + sub_key → 混排 → 得到 32 位 mixin key
    mixin_key = get_mixin_key(get_wbi_keys()["img_key"] + get_wbi_keys()["sub_key"])
    # 参数字典按键排序后转为查询字符串
    params_sorted = dict(sorted(params.items()))
    params_sorted["wts"] = int(time.time())  # 当前 Unix 秒作为签名时间戳
    query = urllib.parse.urlencode(params_sorted)  # URL 编码
    # MD5(query + mixin_key) → w_rid 签名值
    sign = hashlib.md5((query + mixin_key).encode()).hexdigest()
    params_sorted["w_rid"] = sign  # 将签名写入参数
    return params_sorted


def get_wbi_keys() -> dict[str, str]:
    """获取 B站 WBI 签名的 img_key 和 sub_key，缓存 1 小时。"""
    global _wbi_cache, _wbi_cache_time
    # 缓存有效 → 直接返回
    if _wbi_cache and time.time() - _wbi_cache_time < 3600:
        return _wbi_cache
    # 调 B站 nav 接口获取最新的 img_url 和 sub_url
    resp = httpx.get(
        "https://api.bilibili.com/x/web-interface/nav",
        headers={"User-Agent": BILIBILI_USER_AGENT},
    )
    data = resp.json()["data"]  # 响应中的 data 字段
    img_url = data["wbi_img"]["img_url"]  # WBI 图片 URL
    sub_url = data["wbi_img"]["sub_url"]  # WBI 子图 URL
    # 从 URL 中提取文件名（去掉路径和扩展名）作为 key
    _wbi_cache = {
        "img_key": img_url.rsplit("/", 1)[-1].split(".")[0],  # 最后一个 / 后、第一个 . 前
        "sub_key": sub_url.rsplit("/", 1)[-1].split(".")[0],
    }
    _wbi_cache_time = time.time()  # 更新缓存时间
    return _wbi_cache
