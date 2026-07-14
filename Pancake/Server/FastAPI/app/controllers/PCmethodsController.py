from fastapi import APIRouter, Depends  # APIRouter=路由分组 Depends=依赖注入
from app.schemas.PCmethodsSchema import (
    PCmethodsOpenResponse,  # 打开文件夹操作的响应模型
    PCmethodsWorkflowResponse,  # 获取工作流路径的响应模型
)
from app.services.PCmethodsService import PCmethodsService, get_pcmethods_service  # PC方法服务 + 工厂

router = APIRouter()  # 创建此模块的路由实例


@router.get(
    "/pcmethods/getmmd",  # 路径: /api/pcmethods/getmmd
    summary="获取MMD工作流的所有文件夹路径",
    tags=["PCmethods"],
    response_model=PCmethodsWorkflowResponse,
)
async def get_mmd_paths(
    service: PCmethodsService = Depends(get_pcmethods_service),  # 依赖注入获取服务实例
):
    """读取本地 JSON 配置，返回 MMD 工作流所有文件夹的路径和名称。"""
    workflow = await service.get_mmd_workflow()  # 从 PCmethods.json 中查找 MMD 工作流条目
    return PCmethodsWorkflowResponse(**workflow)  # dict 展开为 Pydantic 模型


@router.get(
    "/pcmethods/openmmd",  # 路径: /api/pcmethods/openmmd
    summary="打开MMD工作流的所有文件夹",
    tags=["PCmethods"],
    response_model=PCmethodsOpenResponse,
)
async def open_folder(
    service: PCmethodsService = Depends(get_pcmethods_service),
):
    """在 Windows 资源管理器中打开 MMD 工作流下的所有文件夹。"""
    message = await service.open_mmd_folders()  # 调用 os.startfile 逐个打开
    return PCmethodsOpenResponse(message=message)  # 返回操作结果文本
