from pydantic import BaseModel, Field  # Field 提供 default_factory 等字段级配置


class PCmethodsFolder(BaseModel):
    """MMD 工作流中的一个文件夹项。"""

    name: str  # 文件夹显示名称
    path: str  # 文件夹文件系统路径


class PCmethodsWorkflowResponse(BaseModel):
    """GET /api/pcmethods/getmmd 的响应体。"""

    name: str  # 工作流名称
    # default_factory 确保每个实例独立创建一个空列表，避免可变默认值共享问题
    folder: list[PCmethodsFolder] = Field(default_factory=list)


class PCmethodsOpenResponse(BaseModel):
    """GET /api/pcmethods/openmmd 的响应体。"""

    message: str  # 操作结果提示文本
