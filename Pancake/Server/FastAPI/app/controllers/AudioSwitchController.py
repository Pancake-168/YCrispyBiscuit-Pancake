"""音频转换 API 端点。

- GET  /api/audio/formats                              支持的格式列表
- POST /api/audio/convert                              批量转换（multipart/form-data）
- GET  /api/audio/download/single/{task_id}/{index}    下载单个结果
- GET  /api/audio/download/batch/{task_id}             下载批量 zip

本模块不抛任何业务异常：所有校验与错误都在 service 层完成，
controller 只负责参数声明、调用 service、把结果装进响应模型。
"""

from pathlib import Path  # 提取下载文件扩展名
from typing import List  # 类型标注

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
)  # APIRouter=路由分组 Depends=依赖注入 File/Form=multipart 字段
from fastapi.responses import FileResponse  # 文件下载响应

from app.schemas.AudioSwitchSchema import (
    ConvertResponse,
    FormatsResponse,
)  # 响应模型
from app.services.AudioSwitch.AudioSwitchService import (
    AudioService,
    get_audio_service,
)  # 音频服务 + 工厂
from app.utils.AudioSwitchUtils import (
    EXT_TO_MIME,
)  # 扩展名→MIME 映射（下载时设置 Content-Type）


router = APIRouter()  # 创建此模块的路由实例，由 app/api/router.py include


@router.get(
    "/audio/formats",
    summary="获取支持的音频格式列表",
    tags=["Audio"],
    response_model=FormatsResponse,
)
async def get_formats(
    service: AudioService = Depends(get_audio_service),  # 依赖注入获取音频服务
):
    """返回所有支持输入/输出的格式及详情。前端 AudioSwitchPage 在 useEffect 中调用。"""
    data = await service.get_supported_formats()  # 服务层取格式数据（纯常量组装）
    return FormatsResponse(**data)  # dict 展开为 Pydantic 模型（序列化+校验）


@router.post(
    "/audio/convert",
    summary="转换音频格式",
    tags=["Audio"],
    response_model=ConvertResponse,
)
async def convert_audio(
    files: List[UploadFile] = File(..., description="待转换音频（最多 50 个）"),
    target_format: str = Form(..., description="目标格式，如 mp3 / flac / ogg"),
    service: AudioService = Depends(get_audio_service),
):
    """批量转换音频格式。

    前端 AudioSwitchPage.handleConvert 通过 FormData 提交 files + target_format。
    所有校验（数量/大小/格式白名单/ffmpeg 可用性）都在 service 层完成并抛错。
    """
    result = await service.convert_stream(files, target_format)  # 服务层完成校验+转换
    return ConvertResponse(**result)  # 展开字典为 Pydantic 模型（验证+序列化）


@router.get(
    "/audio/download/single/{task_id}/{index}",
    summary="下载单个转换结果",
    tags=["Audio"],
)
async def download_single(
    task_id: str,
    index: int,
    service: AudioService = Depends(get_audio_service),
):
    """根据 task_id 和文件序号下载转换后的单个文件。"""
    file_path = service.get_file_path(
        task_id, index
    )  # 不存在时 service 层 raise NotFoundError
    filename = service.get_filename(task_id, index)  # 转换后的文件名（下载显示用）
    ext = Path(filename).suffix.lower()  # 提取扩展名（含点，如 ".mp3"）
    media_type = EXT_TO_MIME.get(
        ext, "application/octet-stream"
    )  # 查 MIME 表，找不到回退二进制流
    return FileResponse(
        path=str(file_path),  # 磁盘上的文件路径
        filename=filename,  # Content-Disposition 中的文件名
        media_type=media_type,  # Content-Type 响应头
    )


@router.get(
    "/audio/download/batch/{task_id}",
    summary="下载批量转换结果（zip）",
    tags=["Audio"],
)
async def download_batch(
    task_id: str,
    service: AudioService = Depends(get_audio_service),
):
    """下载所有转换结果的 zip 打包文件。"""
    zip_path = service.get_zip_path(task_id)  # 不存在时 service 层 raise NotFoundError
    return FileResponse(
        path=str(zip_path),
        filename="pancake_audios.zip",  # 固定下载文件名
        media_type="application/zip",  # ZIP MIME 类型
    )
