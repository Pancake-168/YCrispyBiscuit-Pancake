"""实体（Entity）定义，单独文件，使用 ORM（例如 SQLAlchemy）时在此处定义模型类"""

from dataclasses import dataclass


@dataclass
class HealthEntity:
    id: int
    status: str
