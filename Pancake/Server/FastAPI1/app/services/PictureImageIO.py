"""图片输入/输出模块。提供各格式的开图、解码功能。"""

import io  # BytesIO 内存流
import os  # 临时文件操作
import tempfile  # 创建临时文件

from PIL import Image  # Pillow Image

from app.exceptions.errors import ConfigurationError  # 缺少依赖或文件异常时抛出


# ============================================================================
# 统一入口
# ============================================================================


def open_image(data: bytes, detected_format: str, filename: str) -> Image.Image:
    """根据检测到的格式选择合适的开图方式。

    特殊路径：
    - HEIF/HEIC → pillow-heif 插件注册 opener 后走原生 Image.open
    - AVIF → pyavif 临时文件解码
    - SVG → cairosvg 渲染为 PNG 再打开
    - 其余 → Pillow 原生 Image.open
    """

    # HEIF/HEIC：注册 pillow-heif opener
    if detected_format == "HEIF":
        try:
            from pillow_heif import register_heif_opener  # 惰性导入
            register_heif_opener()  # 注册后 Pillow 可直接 open HEIF 文件
        except ImportError:
            raise ConfigurationError("pillow-heif 未安装，无法读取 HEIF/HEIC 文件")

    # AVIF：pyavif 解码（需要临时文件）
    if detected_format == "AVIF":
        return open_avif(data)

    # SVG：cairosvg 渲染为位图
    if detected_format == "SVG":
        try:
            import cairosvg  # 惰性导入
            from xml.etree import ElementTree  # 解析 SVG XML

            svg_kwargs = {}  # 传给 cairosvg 的额外参数
            nat_w = 0.0  # SVG 自然宽度（提前初始化防 UnboundLocalError）
            nat_h = 0.0  # SVG 自然高度
            try:
                root = ElementTree.fromstring(data)  # 解析 SVG XML
                vb = root.get("viewBox")  # viewBox="min-x min-y width height"
                if vb:
                    parts = vb.split()  # 按空格分割
                    if len(parts) == 4:  # 标准 viewBox 必须是 4 个值
                        nat_w, nat_h = float(parts[2]), float(parts[3])  # 取宽高
                else:
                    # 无 viewBox → 尝试 width/height 属性
                    nat_w = float(root.get("width", 0))
                    nat_h = float(root.get("height", 0))
                if nat_w > 4096 or nat_h > 4096:  # 超大图限制渲染宽度
                    svg_kwargs["output_width"] = 4096
            except (ValueError, TypeError):  # 只捕获数值转换异常
                pass  # XML 解析或数值转换失败 → 用默认参数渲染
            png_data = cairosvg.svg2png(bytestring=data, **svg_kwargs)  # SVG → PNG 字节
            return Image.open(io.BytesIO(png_data))  # PNG 字节 → Pillow Image
        except ImportError:
            raise ConfigurationError("cairosvg 未安装，无法渲染 SVG 文件")

    # 通用路径：PNG/JPEG/WEBP/BMP/TIFF/GIF/ICO/PPM/PGM/PBM/TGA
    img = Image.open(io.BytesIO(data))  # 从内存字节流打开
    img.load()  # 强制加载全部像素数据（避免惰性加载在后续操作中失败）
    return img


# ============================================================================
# AVIF 解码
# ============================================================================


def open_avif(data: bytes) -> Image.Image:
    """pyavif 解码 AVIF：字节 → 临时文件 → 解码 → numpy 数组 → Pillow Image。

    pyavif 不支持内存流输入，必须写为临时文件后解码。
    """
    try:
        import pyavif  # 惰性导入
    except ImportError:
        raise ConfigurationError("pyavif 未安装，无法读取 AVIF 文件")

    tmp_path = None  # 临时文件路径，finally 块中清理
    try:
        fd, tmp_path = tempfile.mkstemp(suffix=".avif")  # 创建临时文件
        os.close(fd)  # 关闭文件描述符（用 open 写入）
        with open(tmp_path, "wb") as f:
            f.write(data)  # 写入 AVIF 字节

        decoder = pyavif.Decoder()  # 创建解码器
        decoder.init(tmp_path)  # 从文件初始化解码器
        count = decoder.get_image_count()  # 图片数量（序列图）
        if count == 0:
            raise ConfigurationError("AVIF 文件中无图像")  # 空文件 → 500

        img_data = decoder.get_image(0)  # 取第一帧（numpy 数组）
        has_alpha = decoder.has_alpha()  # 是否有 alpha 通道
        mode = "RGBA" if has_alpha else "RGB"  # 确定色彩模式
        return Image.fromarray(img_data, mode)  # numpy → Pillow Image
    finally:
        if tmp_path:  # 确保删除临时文件
            try:
                os.unlink(tmp_path)
            except OSError:
                pass  # 删除失败忽略（系统会自行清理临时目录）
