import json
import os
from typing import Any

from app.core.config import JSON_DIR
from app.exceptions.errors import NotFoundError


class PCmethodsService:
    def _load_pcmethods_data(self) -> list[dict[str, Any]]:
        json_path = JSON_DIR / "PCmethods.json"
        with open(json_path, "r", encoding="utf-8") as file:
            return json.load(file)

    async def get_mmd_workflow(self) -> dict[str, Any]:
        data = self._load_pcmethods_data()
        for item in data:
            if item.get("name") == "MMD工作流":
                return item
        raise NotFoundError("未找到MMD工作流")

    async def open_mmd_folders(self) -> str:
        workflow = await self.get_mmd_workflow()
        for folder in workflow.get("folder", []):
            path = str(folder.get("path", "")).strip()
            if path:
                os.startfile(path)
        return "MMD工作流文件夹已尝试打开"
