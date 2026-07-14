"""图片变换工具模块。提供色彩模式转换、居中裁切等纯图片处理函数。"""

from PIL import Image  # Pillow Image 对象


# ============================================================================
# 色彩模式转换
# ============================================================================


def apply_color_mode(
    img: Image.Image,
    target_mode: str,  # 目标 Pillow 模式：RGB / RGBA / L / P / 1
    background_color: str = "#FFFFFF",  # RGBA→RGB 时的背景填充色
) -> Image.Image:
    """将图片转换为目标色彩模式，处理透明通道和调色板模式。"""

    current = img.mode  # 当前 Pillow 模式

    # P（调色板）→ 先转为 RGB 或 RGBA（根据是否有透明索引）
    if current == "P":
        img = img.convert("RGBA" if "transparency" in (img.info or {}) else "RGB")
        current = img.mode  # 更新 current 给后续分支

    # RGBA / LA → RGB / L / 1：用背景色填充透明区域
    if current in ("RGBA", "LA") and target_mode in ("RGB", "L", "1"):
        bg = Image.new("RGB", img.size, background_color)  # 创建纯色背景
        if current == "RGBA":
            bg.paste(img, mask=img.split()[3])  # 用 alpha 通道做遮罩合成
        else:  # LA
            bg.paste(img, mask=img.split()[1])  # LA 的 alpha 在索引 1
        img = bg  # 替换为合成后的 RGB 图
        if target_mode != "RGB":
            img = img.convert(target_mode)  # 进一步转 L 或 1
        return img

    # PA → RGB / L / 1：先转为 RGBA 再合成
    if current == "PA" and target_mode in ("RGB", "L", "1"):
        bg = Image.new("RGB", img.size, background_color)
        rgba_img = img.convert("RGBA")  # PA → RGBA
        bg.paste(rgba_img, mask=rgba_img.split()[3])  # 用 alpha 遮罩合成
        img = bg
        if target_mode != "RGB":
            img = img.convert(target_mode)
        return img

    # 标准转换：模式不同 → 直接 convert
    if current != target_mode:
        img = img.convert(target_mode)
    return img


# ============================================================================
# 裁剪
# ============================================================================


def center_crop_square(img: Image.Image) -> Image.Image:
    """居中裁切为正方形（以短边为边长）。用于 ICO 格式预处理。"""
    w, h = img.size  # 原始宽高
    side = min(w, h)  # 取短边作为正方形边长
    left = (w - side) // 2  # 水平居中偏移
    top = (h - side) // 2  # 垂直居中偏移
    return img.crop((left, top, left + side, top + side))  # 裁剪


def center_crop_to(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """居中裁切到指定尺寸。用于 fill 模式的第二步（等比填充后裁掉溢出部分）。"""
    w, h = img.size  # 当前宽高
    left = max(0, (w - target_w) // 2)  # 水平居中偏移（防负值）
    top = max(0, (h - target_h) // 2)  # 垂直居中偏移（防负值）
    right = min(w, left + target_w)  # 右边界（防溢出）
    bottom = min(h, top + target_h)  # 下边界（防溢出）
    return img.crop((left, top, right, bottom))  # 裁剪
