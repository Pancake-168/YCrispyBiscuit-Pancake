"""SVG 输出模块。提供位图 → SVG 矢量路径转换和位图嵌入两种模式。"""

import base64  # base64 编码（位图嵌入 SVG 用）
import io  # BytesIO 内存流
import math  # 角度计算（轮廓点极角排序）

import numpy as np  # 像素数组操作
from PIL import Image  # Pillow Image


# ============================================================================
# SVG 矢量化输出
# ============================================================================


def save_as_svg(
    img: Image.Image,
    quality: int | None = None,  # 控制颜色量化层级（3–16）
    background_color: str = "#FFFFFF",  # 透明填充色
) -> bytes:
    """将位图矢量化输出为真正的 SVG 矢量路径。

    处理流程：
    1. 去除透明通道（用背景色填充）
    2. 颜色量化（连续色 → 离散层级）
    3. 提取每种颜色的连通区域外轮廓
    4. 生成 SVG <path d="..."> 元素

    质量参数 quality（0–100）控制量化层级数量，越高越精细。
    """

    # ---- 处理透明：用 background_color 填充 alpha 区域 ----
    if img.mode in ("RGBA", "LA", "PA") or (
        img.mode == "P" and "transparency" in (img.info or {})
    ):
        bg = Image.new("RGB", img.size, background_color)  # 纯色背景
        if img.mode == "RGBA":
            bg.paste(img, mask=img.split()[3])  # alpha 做遮罩
        elif img.mode in ("LA", "PA"):
            rgba_img = img.convert("RGBA")  # 先转 RGBA
            bg.paste(rgba_img, mask=rgba_img.split()[3])
        else:
            bg.paste(img)  # P 模式有透明索引，直接 paste
        img = bg  # 替换为无透明的 RGB 图
    elif img.mode != "RGB":
        img = img.convert("RGB")  # 其他模式统一转 RGB

    arr = np.array(img)  # (h, w, 3) uint8 数组
    h, w = arr.shape[:2]  # 提取高度和宽度

    # ---- 颜色量化 ----
    # quality 0–100 → levels 3–16，桶大小 = 256 // levels
    levels = max(3, min(16, round((quality or 85) * 16 / 100)))  # 默认 quality=85 → ~14 层级
    bucket = 256 // levels  # 量化桶大小
    q_arr = (arr // bucket) * (256 // (levels - 1))  # 整除归并
    q_arr = np.clip(q_arr, 0, 255).astype(np.uint8)  # 钳位防溢出

    paths: list[str] = []  # 收集所有 SVG <path> 元素
    seen_colors: set[tuple] = set()  # 已处理的量化色调（去重）

    # 步长 2 采样（相邻像素通常同色，大幅减少重复处理）
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            color = tuple(q_arr[y, x].tolist())  # 当前像素的量化色 (R, G, B)
            if color in seen_colors:  # 已处理过此颜色 → 跳过
                continue
            seen_colors.add(color)  # 标记已处理

            ref_color = q_arr[y, x]  # 参考颜色（3 元素数组）
            # 生成二值 mask：匹配此颜色的所有像素位置
            mask = np.all(q_arr == ref_color, axis=2) if q_arr.ndim == 3 else (q_arr == ref_color)
            if not mask.any():  # 无匹配像素 → 跳过
                continue

            contours = trace_contours(mask)  # 提取该颜色的所有独立轮廓
            if not contours:
                continue

            hex_color = "#{:02x}{:02x}{:02x}".format(*color)  # RGB → #RRGGBB
            for contour in contours:
                if len(contour) < 3:  # 至少需要 3 个点才能形成闭合路径
                    continue
                # 构建 SVG path d 属性
                d_parts = [f"M{contour[0][0]},{contour[0][1]}"]  # M = moveto（起始点）
                for px, py in contour[1:]:
                    d_parts.append(f"L{px},{py}")  # L = lineto（连线到后续点）
                d_parts.append("Z")  # Z = closepath（闭合路径）
                # 轮廓路径：填充色 + 同色描边消除邻接轮廓间隙
                paths.append(
                    f'<path d="{" ".join(d_parts)}" fill="{hex_color}" stroke="{hex_color}" stroke-width="1"/>'
                )

    # 无路径 → 退化为纯色矩形
    svg_body = "\n  ".join(paths) if paths else f'<rect width="{w}" height="{h}" fill="{background_color}"/>'
    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n'
        f'  {svg_body}\n</svg>'
    )
    return svg.encode("utf-8")  # 字符串 → UTF-8 字节


# ============================================================================
# SVG 位图嵌入
# ============================================================================


def save_as_svg_embed(img: Image.Image) -> bytes:
    """将位图以 base64 PNG 的方式嵌入 SVG 容器（不矢量化）。"""

    # 确保输出色彩模式兼容 PNG 编码
    if img.mode == "P":
        img = img.convert("RGBA" if "transparency" in (img.info or {}) else "RGB")
    elif img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if img.mode in ("LA", "PA") else "RGB")

    buf = io.BytesIO()  # 内存缓冲区
    img.save(buf, format="PNG")  # 编码为 PNG
    png_base64 = base64.b64encode(buf.getvalue()).decode("ascii")  # 转 base64 字符串

    width, height = img.size  # 图片尺寸
    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'width="{width}" height="{height}" viewBox="0 0 {width} {height}">\n'
        f'  <image width="{width}" height="{height}" '
        f'xlink:href="data:image/png;base64,{png_base64}" />\n'  # data URI 嵌入
        '</svg>'
    )
    return svg.encode("utf-8")


# ============================================================================
# 轮廓提取
# ============================================================================


def trace_contours(mask: "np.ndarray") -> list[list[tuple[int, int]]]:
    """从二值 mask 中提取所有连通区域的外轮廓。

    算法：BFS flood-fill 找连通区域 → 提取边缘点 → 极角排序 → 采样简化。
    返回轮廓列表，每个轮廓是一个 (x, y) 坐标点序列。
    """
    contours: list[list[tuple[int, int]]] = []  # 结果列表
    visited = np.zeros_like(mask, dtype=bool)  # BFS 访问标记矩阵
    h, w = mask.shape  # mask 尺寸

    # 8-邻域方向（用于 BFS flood-fill）
    dirs = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]

    for y in range(h):
        for x in range(w):
            if not mask[y, x] or visited[y, x]:  # 非目标色或已访问 → 跳过
                continue

            # ---- BFS flood-fill：找该颜色的连通区域 ----
            region: list[tuple[int, int]] = []  # 连通区域像素集合
            stack = [(y, x)]  # DFS 栈
            visited[y, x] = True  # 标记访问
            while stack:
                cy, cx = stack.pop()
                region.append((cx, cy))  # 存入 (x, y)
                for dy, dx in dirs:  # 8-邻域扩展
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((ny, nx))

            # ---- 提取边界点：4-邻域不全在区域内 = 边界 ----
            boundary: set[tuple[int, int]] = set()
            for cx, cy in region:
                # 图像边缘的像素自动算边界
                if cx == 0 or cx == w - 1 or cy == 0 or cy == h - 1:
                    boundary.add((cx, cy))
                # 检查 4-邻域（上下左右）
                elif not all(
                    mask[cy + dy, cx + dx]
                    for dy, dx in [(0, 1), (0, -1), (1, 0), (-1, 0)]
                ):
                    boundary.add((cx, cy))

            if len(boundary) < 3:  # 边界点太少 → 跳过
                continue

            # ---- 极角排序（围绕质心） + 采样简化 ----
            centroid = (
                sum(p[0] for p in boundary) / len(boundary),  # 质心 x
                sum(p[1] for p in boundary) / len(boundary),  # 质心 y
            )
            # 按相对于质心的极角排序
            sorted_boundary = sorted(
                boundary,
                key=lambda p: math.atan2(p[1] - centroid[1], p[0] - centroid[0]),
            )
            step = max(1, len(sorted_boundary) // 128)  # 采样步长 ≈ 128 个点
            simplified = sorted_boundary[::step]  # 等间隔采样
            if simplified[-1] != simplified[0]:  # 确保闭合（首尾相同）
                simplified.append(simplified[0])
            contours.append(simplified)

    return contours
