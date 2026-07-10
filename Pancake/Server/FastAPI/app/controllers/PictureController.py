"""
图片转换 API 端点。

- GET  /api/picture/formats              支持的格式列表
- POST /api/picture/convert              批量转换（multipart/form-data）
- GET  /api/picture/download/single/{task_id}/{index}  下载单个结果
- GET  /api/picture/download/batch/{task_id}           下载批量 zip
"""

from fastapi import APIRouter, UploadFile, File, Form  # File=标记为文件字段 Form=标记为表单字段
from fastapi.responses import FileResponse              # 文件下载响应（设置 Content-Disposition）
from app.exceptions.errors import BadRequestError, NotFoundError  # 项目统一异常体系（走全局 handler，响应带 request_id）
from pathlib import Path
from typing import List, Optional

from app.schemas.PictureSchema import (  # Pydantic 模型（请求校验/响应序列化）
    FormatsResponse,
    ConvertResponse,
    FormatDetail,
)
from app.services.PictureService import (
    PictureService,
    ConversionParams,   # 转换参数 dataclass（由 Form 字段构造）
    MAX_FILE_SIZE,      # 单文件上限常量（用于错误提示）
    MAX_FILES,          # 单次最大文件数常量
)
from app.utils.PictureUtils import EXT_TO_MIME  # 扩展名→MIME 映射（下载时设置 Content-Type）

router = APIRouter()          # 创建路由实例，由 app/api/router.py include
service = PictureService()    # 服务单例（模块加载时创建，生命周期=进程）


@router.get(
    "/picture/formats",
    summary="获取支持的图片格式列表",
    tags=["Picture"],
    response_model=FormatsResponse,  # FastAPI 自动将返回字典序列化为 Pydantic 模型
)
async def get_formats():
    """返回所有支持输入/输出的格式及详情。前端 PictureSwitchPage 在 useEffect 中调用。"""
    data = await service.get_supported_formats()  # 调用服务层获取格式化数据
    # 将 FORMAT_DETAILS 的字典值构造为 Pydantic FormatDetail 对象
    # **val 展开 to_dict() 返回的 7 字段字典，匹配 response_model 的类型声明
    details = {key: FormatDetail(**val) for key, val in data["format_details"].items()}
    return FormatsResponse(
        input_formats=data["input_formats"],       # 如 ["png", "jpg", "webp", ...]
        output_formats=data["output_formats"],     # 如 ["png", "jpeg", "webp", ...]
        format_details=details,                     # 如 {"png": FormatDetail(...), ...}
    )


@router.post(
    "/picture/convert",
    summary="转换图片格式",
    tags=["Picture"],
    response_model=ConvertResponse,
)
async def convert_picture(
    # multipart/form-data：每个字段必须用 Form() 逐个声明
    # FastAPI 不支持将 Pydantic Schema 直接用作 multipart Body（必须用 Form 逐字段）
    # 所以 ConvertRequest Schema 仅用于文档组织，不直接用作参数
    files: List[UploadFile] = File(..., description="待转换图片（最多 50 个）"),
    # UploadFile 是 FastAPI 的异步文件包装器：有 filename 属性、read()/seek() 等方法
    target_format: str = Form(..., description="目标格式，如 webp / jpeg / png"),
    quality: Optional[int] = Form(None, ge=1, le=100, description="有损格式质量 1-100"),
    # quality=None 表示使用 Pillow 默认值；前端仅在 lossy_options=true 且未启无损时发送
    lossless: bool = Form(False, description="WebP 无损模式"),
    # 前端仅在 lossless 开关打开时才发送 lossless=true；关闭时不发送→默认 False
    resize_mode: str = Form("none", description="缩放模式: none / fit / fill / exact"),
    max_width: Optional[int] = Form(None, ge=1, le=16384, description="最大宽度 px"),
    max_height: Optional[int] = Form(None, ge=1, le=16384, description="最大高度 px"),
    # max_width/height=None 表示不限制；max 16384 是 Pillow 支持的上限
    width: Optional[int] = Form(None, ge=1, le=16384, description="精确宽度 px（exact 模式）"),
    height: Optional[int] = Form(None, ge=1, le=16384, description="精确高度 px（exact 模式）"),
    keep_aspect_ratio: bool = Form(True, description="缩放时保持宽高比"),
    background_color: str = Form("#FFFFFF", pattern=r"^#[0-9a-fA-F]{6}$", description="透明转不透明填充色（#RRGGBB）"),
    # pattern 正则确保格式为 # 后接 6 位 hex，防止非法颜色值传入 PIL
    color_mode: str = Form("auto", description="色彩模式: auto / RGB / RGBA / L / P"),
    strip_metadata: bool = Form(True, description="移除 EXIF 等元数据"),
):
    """批量转换图片格式，附带分辨率调整和压缩选项。

    前端 PictureSwitchPage.handleConvert 构造 params 对象后通过 FormData 提交。
    参数发送条件：quality/lossless/max_width/max_height/width/height 是条件发送的，
    不满足条件时不 append 到 FormData → 后端收到 None 或默认值。
    """
    # ---- 校验 ----
    if not files:                                        # 空文件列表（前端已阻止，后端防御）
        raise BadRequestError("请至少上传一个文件")

    if len(files) > MAX_FILES:                           # 超过单次上限 50 个
        raise BadRequestError(f"单次最多转换 {MAX_FILES} 个文件")

    # ---- 构建参数 dataclass ----
    # 将 Form 字段值打包为 ConversionParams，传给服务层
    params = ConversionParams(
        target_format=target_format,        # 如 "webp"
        quality=quality,                    # None 或 1-100
        lossless=lossless,                  # True/False
        resize_mode=resize_mode,            # "none"/"fit"/"fill"/"exact"
        max_width=max_width,                # None 或 1-16384
        max_height=max_height,              # None 或 1-16384
        width=width,                        # None 或 1-16384
        height=height,                      # None 或 1-16384
        keep_aspect_ratio=keep_aspect_ratio,  # True/False
        background_color=background_color,    # "#RRGGBB"
        color_mode=color_mode,                # "auto"/"RGB"/"RGBA"/"L"/"P"
        strip_metadata=strip_metadata,        # True/False
    )

    # ---- 执行转换 ----
    # convert_stream 是流式转换（逐文件读取→线程池处理→释放），适合 Web 并发
    result = await service.convert_stream(files, params)
    return ConvertResponse(**result)  # 展开字典为 Pydantic 模型（验证+序列化）


@router.get(
    "/picture/download/single/{task_id}/{index}",
    summary="下载单个转换结果",
    tags=["Picture"],
)
async def download_single(task_id: str, index: int):
    """根据 task_id 和文件序号下载转换后的单个文件。

    前端调用：handleDownloadSingle → getSingleDownloadUrl(taskId, index) → 此端点。
    """
    file_path = service.get_file_path(task_id, index)    # 从 _tasks 字典查文件路径
    if file_path is None or not file_path.exists():       # 任务不存在/序号越界/文件已清理
        raise NotFoundError("文件不存在或已过期")

    # 确定响应文件名（优先用存储的 converted_name）
    stored = service._tasks.get(task_id, [])               # 取任务的文件列表
    filename = stored[index].converted_name if index < len(stored) else "converted"
    ext = Path(filename).suffix.lower()                    # 提取扩展名（含点，如 ".webp"）
    media_type = EXT_TO_MIME.get(ext, "application/octet-stream")  # 查 MIME 表，找不到回退二进制流

    return FileResponse(
        path=str(file_path),           # 磁盘上的文件路径
        filename=filename,             # Content-Disposition 中的文件名（浏览器下载用）
        media_type=media_type,         # Content-Type 响应头（浏览器据此决定处理方式）
    )


@router.get(
    "/picture/download/batch/{task_id}",
    summary="下载批量转换结果（zip）",
    tags=["Picture"],
)
async def download_batch(task_id: str):
    """下载所有转换结果的 zip 打包文件。

    前端调用：handleDownloadBatch → getBatchDownloadUrl(taskId) → 此端点。
    注意：前端不使用 ConvertResponse.zip_url，直接硬编码拼接此路径。
    """
    zip_path = service.get_zip_path(task_id)              # 从 _tasks 字典查 zip 路径
    if zip_path is None or not zip_path.exists():          # 任务不存在/单文件无 zip/文件已清理
        raise NotFoundError("文件不存在或已过期")

    return FileResponse(
        path=str(zip_path),
        filename="pancake_pictures.zip",                   # 固定下载文件名
        media_type="application/zip",                      # ZIP MIME 类型
    )
