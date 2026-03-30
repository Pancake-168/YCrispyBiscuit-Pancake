import os
import json
from fastapi import APIRouter, HTTPException
from app.core.config import JSON_DIR


router = APIRouter()


@router.get("/pcmethods/getMMD")
async def getMMDPaths():
    """获取MMD工作流的所有文件夹路径"""
    try:
        # 获取JSON文件路径
        json_path = JSON_DIR / "PCmethods.json"

        # 读取JSON文件
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 查找MMD工作流
        for item in data:
            if item.get("name") == "MMD工作流":
                return item

        raise HTTPException(status_code=404, detail="未找到MMD工作流")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取MMD工作流失败: {str(e)}")


@router.get("/pcmethods/openMMD")
async def openFolder():
    """打开mmd工作流的所有文件夹"""
    try:
        # 获取JSON文件路径
        json_path = JSON_DIR / "PCmethods.json"

        # 读取JSON文件
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 查找MMD工作流
        for item in data:
            if item.get("name") == "MMD工作流":
                for folder in item.get("folder", []):
                    name = folder.get("name", "").strip()
                    path = folder.get("path", "").strip()
                    if path:
                        # 在Windows上打开文件夹
                        print("正在打开文件夹:", name, path)
                        os.startfile(path)
                    else:
                        # 如果路径为空，可以记录或跳过
                        pass

        return {"message": "MMD工作流文件夹已尝试打开"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"打开文件夹失败: {str(e)}")
