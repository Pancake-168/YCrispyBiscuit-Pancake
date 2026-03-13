"""
Data_Source_ACGN_Personal_Preference_Table_Generator 相关接口路由
- 仅负责参数接收、权限校验、调用 service 层
- 不直接操作数据库
"""


# 导入 FastAPI 路由相关模块
from fastapi import APIRouter, Depends, HTTPException, Query  # APIRouter 用于定义路由，Depends 用于依赖注入，HTTPException 用于抛出 HTTP 异常，Query 用于处理查询参数
from sqlalchemy.orm import Session  # 导入 SQLAlchemy 的 Session 类型，用于数据库会话
from typing import List, Optional  # 导入类型注解 List 和 Optional

from app.dependencies import get_db  # 导入数据库依赖注入方法
from app.services import Data_Source_ACGN_Personal_Preference_Table_Generator as generator_service  # 导入 service 层，负责业务逻辑
# from app.schemas import ... # 建议定义好 schema 用于返回，提升类型安全和文档自动生成



# 创建 APIRouter 实例，设置路由前缀和标签
router = APIRouter(prefix="/Data_Source_ACGN_Personal_Preference_Table_Generator", tags=["Data ACGN Generator"])





"""
    查询指定表ID的数据源
    - id: 主键ID
    - db: 数据库会话
    - 返回: 数据源列表（每个为 dict 或 schema）
    """
# 查询指定表ID的数据源
# 前端请求方式：GET /Data_Source_ACGN_Personal_Preference_Table_Generator/{id}
# 需传递路径参数 id（生成器主键），如 /Data_Source_ACGN_Personal_Preference_Table_Generator/1
@router.get("/{id}", summary="查询指定表ID的数据源")
def list_data_source_by_generator_id(
    id: int,  # 路径参数，生成器主键 ID
    db: Session = Depends(get_db)  # 依赖注入数据库会话
) -> List[dict]:
    # 调用 service 层方法，查询指定 ID 的数据源
    return generator_service.list_data_source_by_generator_id(db, id) # 调用 service 层方法，返回指定 ID 的数据源列表







# 下面要写一个爬取数据源的接口，针对指定的 ACGN 个人喜好表生成器 ID，从对应的官方网站爬取对应的数据源
# 但这里是controller层，应该只负责前端对于指定ID的传递和唤起该服务
# 实际的爬取逻辑应该在 service 层实现
@router.post("/fetch/{id}", summary="爬取指定表ID的数据源")
def fetch_data_source_by_generator_id(
    id: int,  # 路径参数，生成器主键 ID
    db: Session = Depends(get_db)  # 依赖注入数据库会话
) -> dict:
    """
    爬取指定表ID的数据源
    - id: 主键ID
    - db: 数据库会话
    - 返回: 爬取结果（成功或失败信息）
    """
    # 调用 service 层方法，爬取指定 ID 的数据源
    return generator_service.fetch_data_source_by_generator_id(db, id)


