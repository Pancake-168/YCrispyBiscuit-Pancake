from fastapi import APIRouter
from app.schemas.PCmethodsSchema import (
    PCmethodsOpenResponse,
    PCmethodsWorkflowResponse,
)
from app.services.PCmethodsService import PCmethodsService


router = APIRouter()
service = PCmethodsService()


@router.get(
    "/pcmethods/getmmd",
    summary="获取MMD工作流的所有文件夹路径",
    tags=["PCmethods"],
    response_model=PCmethodsWorkflowResponse,
)
async def getMMDPaths():
    """获取MMD工作流的所有文件夹路径"""
    workflow = await service.get_mmd_workflow()
    return PCmethodsWorkflowResponse(**workflow)


@router.get(
    "/pcmethods/openmmd",
    summary="打开MMD工作流的所有文件夹",
    tags=["PCmethods"],
    response_model=PCmethodsOpenResponse,
)
async def openFolder():
    """打开mmd工作流的所有文件夹"""
    message = await service.open_mmd_folders()
    return PCmethodsOpenResponse(message=message)
