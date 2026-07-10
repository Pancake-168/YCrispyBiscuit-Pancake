"""
图片转换 API 端点。

- GET  /api/picture/formats              支持的格式列表
- POST /api/picture/convert              批量转换（multipart/form-data）
- GET  /api/picture/download/single/{task_id}/{index}  下载单个结果
- GET  /api/picture/download/batch/{task_id}           下载批量 zip
"""

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi import HTTPException
from pathlib import Path
from typing import List, Optional

from app.schemas.PictureSchema import (
    FormatsResponse,
    ConvertResponse,
    FormatDetail,
)
from app.services.PictureService import (
    PictureService,
    ConversionParams,
    MAX_FILE_SIZE,
    MAX_FILES,
)
from app.utils.PictureUtils import EXT_TO_MIME

router = APIRouter()
service = PictureService()


@router.get(
    "/picture/formats",
    summary="获取支持的图片格式列表",
    tags=["Picture"],
    response_model=FormatsResponse,
)
async def get_formats():
    """返回所有支持输入/输出的格式及详情。"""
    data = await service.get_supported_formats()
    # 构建 FormatDetail 对象以匹配 response_model
    details = {key: FormatDetail(**val) for key, val in data["format_details"].items()}
    return FormatsResponse(
        input_formats=data["input_formats"],
        output_formats=data["output_formats"],
        format_details=details,
    )


@router.post(
    "/picture/convert",
    summary="转换图片格式",
    tags=["Picture"],
    response_model=ConvertResponse,
)
async def convert_picture(
    # multipart/form-data：每个字段必须用 Form() 逐个声明
    # ConvertRequest Schema 仅用于文档组织，不直接用作 Body 参数
    files: List[UploadFile] = File(..., description="待转换图片（最多 50 个）"),
    target_format: str = Form(..., description="目标格式，如 webp / jpeg / png"),
    quality: Optional[int] = Form(None, ge=1, le=100, description="有损格式质量 1-100"),
    lossless: bool = Form(False, description="WebP 无损模式"),
    resize_mode: str = Form("none", description="缩放模式: none / fit / fill / exact"),
    max_width: Optional[int] = Form(None, ge=1, le=16384, description="最大宽度 px"),
    max_height: Optional[int] = Form(None, ge=1, le=16384, description="最大高度 px"),
    width: Optional[int] = Form(
        None, ge=1, le=16384, description="精确宽度 px（exact 模式）"
    ),
    height: Optional[int] = Form(
        None, ge=1, le=16384, description="精确高度 px（exact 模式）"
    ),
    keep_aspect_ratio: bool = Form(True, description="缩放时保持宽高比"),
    background_color: str = Form("#FFFFFF", pattern=r"^#[0-9a-fA-F]{6}$", description="透明转不透明填充色（#RRGGBB）"),
    color_mode: str = Form("auto", description="色彩模式: auto / RGB / RGBA / L / P"),
    strip_metadata: bool = Form(True, description="移除 EXIF 等元数据"),
):
    """批量转换图片格式，附带分辨率调整和压缩选项。"""
    # ---- 校验 ----
    if not files:
        raise HTTPException(status_code=400, detail="请至少上传一个文件")

    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"单次最多转换 {MAX_FILES} 个文件")

    # ---- 构建参数 ----
    params = ConversionParams(
        target_format=target_format,
        quality=quality,
        lossless=lossless,
        resize_mode=resize_mode,
        max_width=max_width,
        max_height=max_height,
        width=width,
        height=height,
        keep_aspect_ratio=keep_aspect_ratio,
        background_color=background_color,
        color_mode=color_mode,
        strip_metadata=strip_metadata,
    )

    # ---- 逐文件读取→转换→释放，避免全量驻留内存 ----
    result = await service.convert_stream(files, params)
    return ConvertResponse(**result)


@router.get(
    "/picture/download/single/{task_id}/{index}",
    summary="下载单个转换结果",
    tags=["Picture"],
)
async def download_single(task_id: str, index: int):
    """根据 task_id 和文件序号下载转换后的单个文件。"""
    file_path = service.get_file_path(task_id, index)
    if file_path is None or not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在或已过期")

    stored = service._tasks.get(task_id, [])
    filename = stored[index].converted_name if index < len(stored) else "converted"
    ext = Path(filename).suffix.lower()
    media_type = EXT_TO_MIME.get(ext, "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type=media_type,
    )


@router.get(
    "/picture/download/batch/{task_id}",
    summary="下载批量转换结果（zip）",
    tags=["Picture"],
)
async def download_batch(task_id: str):
    """下载所有转换结果的 zip 打包文件。"""
    zip_path = service.get_zip_path(task_id)
    if zip_path is None or not zip_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在或已过期")

    return FileResponse(
        path=str(zip_path),
        filename="pancake_pictures.zip",
        media_type="application/zip",
    )
