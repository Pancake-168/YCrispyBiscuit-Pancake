"""音频转换任务存储。管理任务的 LRU 缓存、zip 打包、文件下载和自动清理。"""

import asyncio  # 异步清理定时器
import shutil  # 目录递归删除
import zipfile  # zip 打包
from collections import OrderedDict  # LRU 淘汰依赖插入顺序
from dataclasses import dataclass  # 数据类装饰器
from pathlib import Path  # 路径操作
from typing import Optional  # 可选类型


# ============================================================================
# 数据结构
# ============================================================================


@dataclass
class StoredFile:
    """转换完成的文件引用。"""

    path: Path  # 磁盘上的完整路径
    converted_name: str  # 转换后的文件名
    converted_size: int  # 文件大小（字节）


# ============================================================================
# 任务存储
# ============================================================================


class AudioTaskStore:
    """任务存储管理器。提供任务注册、文件下载、LRU 淘汰和定时清理。"""

    def __init__(self, output_dir: Path, max_tasks: int, cleanup_seconds: int):
        self.output_dir = output_dir  # 输出根目录
        self.max_tasks = max_tasks  # 最大任务数（超出触发 LRU）
        self.cleanup_seconds = cleanup_seconds  # 任务完成后保留的秒数
        self._tasks: OrderedDict[str, list[StoredFile]] = (
            OrderedDict()
        )  # 任务字典（按插入顺序）

    # ------------------------------------------------------------------
    # 注册
    # ------------------------------------------------------------------

    async def register_async(
        self, task_id: str, task_dir: Path, stored: list[StoredFile]
    ) -> None:
        """异步注册一个转换任务：LRU 淘汰和 zip 打包放线程池，避免阻塞事件循环。"""
        self._tasks[task_id] = stored  # 存入任务字典（纯内存操作，直接执行）

        loop = asyncio.get_running_loop()  # 当前事件循环（调用方处于异步上下文）

        # LRU 淘汰：超出容量时删除最早的条目及其临时目录（磁盘删除放线程池）
        while len(self._tasks) > self.max_tasks:
            oldest_id, _ = self._tasks.popitem(last=False)  # 从 OrderedDict 头部弹出
            oldest_dir = self.output_dir / oldest_id  # 拼接旧任务目录路径
            if oldest_dir.exists():
                # ignore_errors=True 作为 rmtree 的位置参数，删除失败不阻断注册
                await loop.run_in_executor(None, shutil.rmtree, oldest_dir, True)

        # 多个输出文件时打包 batch.zip（磁盘 IO 放线程池，避免阻塞事件循环）
        if len(stored) > 1:
            zip_path = task_dir / "batch.zip"  # zip 文件路径
            await loop.run_in_executor(None, self._write_zip, zip_path, stored)

        self.schedule_cleanup(task_id, task_dir)  # 启动定时清理

    @staticmethod
    def _write_zip(zip_path: Path, stored: list[StoredFile]) -> None:
        """同步打包 zip（供线程池调用）。zip 内文件名使用 converted_name。"""
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for sf in stored:
                zf.write(
                    sf.path, sf.converted_name
                )  # 写入 zip（文件在 zip 内的名字为 converted_name）

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------

    def get_file_path(self, task_id: str, index: int) -> Optional[Path]:
        """根据 task_id 和文件序号返回磁盘路径，供下载端点使用。"""
        stored = self._tasks.get(task_id, [])  # 获取任务的文件列表
        if index < 0 or index >= len(stored):  # 序号越界检查（含负索引）
            return None
        return stored[index].path  # 返回 Path 对象

    def get_filename(self, task_id: str, index: int) -> str:
        """根据 task_id 和序号返回转换后的文件名。"""
        stored = self._tasks.get(task_id, [])
        # 同时校验上下界：负 index 会命中 Python 负索引取到最后一个文件，必须拒绝
        return (
            stored[index].converted_name if 0 <= index < len(stored) else "converted"
        )  # 兜底

    def get_zip_path(self, task_id: str) -> Optional[Path]:
        """根据 task_id 返回 batch.zip 路径，供批量下载端点使用。"""
        if task_id not in self._tasks:  # 任务不存在/已过期
            return None
        zip_path = self.output_dir / task_id / "batch.zip"  # 拼接路径
        if zip_path.exists():  # 文件确实存在
            return zip_path
        return None  # zip 不存在（单文件转换不生成 zip）

    # ------------------------------------------------------------------
    # 清理
    # ------------------------------------------------------------------

    def schedule_cleanup(self, task_id: str, task_dir: Path) -> None:
        """延迟清理：在 cleanup_seconds 秒后删除任务临时目录和内存引用。"""

        async def _clean():
            await asyncio.sleep(self.cleanup_seconds)  # 等待指定秒数
            if task_dir.exists():  # 目录可能已被手动删除
                shutil.rmtree(task_dir, ignore_errors=True)  # 递归删除临时目录
            self._tasks.pop(task_id, None)  # 清除内存引用

        loop = asyncio.get_running_loop()  # 获取当前事件循环
        loop.create_task(_clean())  # 创建后台协程（非阻塞）
