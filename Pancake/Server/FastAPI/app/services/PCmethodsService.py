"""PC 方法服务。从可写目录读取工作流配置，首次启动时从 exe 内部复制默认配置。"""

import json  # 解析 JSON 配置文件
import os  # os.startfile 打开 Windows 资源管理器
import shutil  # 复制文件
from typing import Any

from app.core.config import JSON_DIR, WRITABLE_DIR  # JSON 配置目录 + 可写目录
from app.exceptions.errors import NotFoundError  # 配置项未找到时抛出 404


def get_pcmethods_service() -> "PCmethodsService":
    """工厂函数：每次请求创建新实例（服务本身无状态）。"""
    return PCmethodsService()


class PCmethodsService:
    """提供 MMD 工作流配置读取和文件夹操作。"""

    @property
    def _json_path(self):
        """可写目录下的配置文件路径，不存在时从 exe 内部复制默认配置。"""
        writable_json_dir = WRITABLE_DIR / "json"
        writable_json_dir.mkdir(parents=True, exist_ok=True)
        target = writable_json_dir / "PCmethods.json"
        if not target.exists():
            shutil.copy2(JSON_DIR / "PCmethods.json", target)
        return target

    def _load_pcmethods_data(self) -> list[dict[str, Any]]:
        """从 PCmethods.json 加载工作流配置数据。"""
        with open(self._json_path, "r", encoding="utf-8") as file:
            return json.load(file)

    async def get_mmd_workflow(self) -> dict[str, Any]:
        """查找并返回名为 'MMD工作流' 的配置条目。"""
        data = self._load_pcmethods_data()  # 加载全部配置
        for item in data:  # 遍历查找
            if item.get("name") == "MMD工作流":
                return item  # 找到即返回
        raise NotFoundError("未找到MMD工作流")  # 遍历完未找到 → 404

    async def open_mmd_folders(self) -> str:
        """在 Windows 资源管理器中打开 MMD 工作流的所有文件夹。"""
        workflow = await self.get_mmd_workflow()  # 获取工作流配置
        for folder in workflow.get("folder", []):  # 遍历 folder 列表
            path = str(folder.get("path", "")).strip()  # 提取路径字符串
            if path:  # 路径非空才打开
                os.startfile(path)  # Windows 资源管理器打开
        return "MMD工作流文件夹已尝试打开"  # 返回操作结果文本

    async def open_single_mmd_folder(self, folder_name: str) -> str:
        """在 Windows 资源管理器中打开 MMD 工作流中指定名称的文件夹。"""
        workflow = await self.get_mmd_workflow()
        for folder in workflow.get("folder", []):
            if folder.get("name") == folder_name:
                path = str(folder.get("path", "")).strip()
                if not path:
                    raise NotFoundError(f"文件夹 '{folder_name}' 的路径为空")
                os.startfile(path)
                return f"已打开文件夹: {folder_name}"
        raise NotFoundError(f"未找到文件夹: {folder_name}")
