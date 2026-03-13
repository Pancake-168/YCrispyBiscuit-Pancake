"""
ACGN_Personal_Preference_Table_Generator 相关接口路由
- 仅负责参数接收、权限校验、调用 service 层
- 不直接操作数据库
"""



# 导入 FastAPI 路由相关模块
from fastapi import APIRouter, Depends, HTTPException, Query  # APIRouter 用于定义路由，Depends 用于依赖注入，HTTPException 用于抛出 HTTP 异常，Query 用于处理查询参数
from sqlalchemy.orm import Session  # 导入 SQLAlchemy 的 Session 类型，用于数据库会话
from typing import List, Optional  # 导入类型注解 List 和 Optional

from app.dependencies import get_db  # 导入数据库依赖注入方法
from app.services import ACGN_Personal_Preference_Table_Generator as generator_service  # 导入 service 层，负责业务逻辑
# from app.schemas import ... # 建议定义好 schema 用于返回，提升类型安全和文档自动生成




# 创建 APIRouter 实例，设置路由前缀和标签
router = APIRouter(prefix="/ACGN_Personal_Preference_Table_Generator", tags=["ACGN Generator"])






"""
    查询所有生成器
    - db: 数据库会话
    - 返回: 生成器列表（每个为 dict 或 schema）
    """
# 查询所有生成器接口，GET 请求
# 前端请求方式：GET /ACGN_Personal_Preference_Table_Generator/
# 无需传参，直接请求即可，返回生成器列表
@router.get("/all", summary="查询所有生成器")
def list_generators(
    db: Session = Depends(get_db)  # 依赖注入数据库会话
) -> List[dict]:  # 返回值类型为生成器字典列表
    return generator_service.list_generators(db)  # 调用 service 层方法，返回所有生成器







"""
    根据主键ID查询生成器
    - id: 主键ID
    - db: 数据库会话
    - 返回: 单个生成器 dict 或 None
    """
# 根据主键 ID 查询生成器接口，GET 请求
# 前端请求方式：GET /ACGN_Personal_Preference_Table_Generator/{id}
# 需传递路径参数 id（生成器主键），如 /ACGN_Personal_Preference_Table_Generator/1
@router.get("/{id}", summary="根据ID查询生成器")
def get_generator_by_id(
    id: int,  # 路径参数，生成器主键 ID
    db: Session = Depends(get_db)  # 依赖注入数据库会话
) -> Optional[dict]:  # 返回值类型为单个生成器字典或 None
    result = generator_service.get_generator_by_id(db, id)  # 调用 service 层方法查询
    if not result:  # 如果未查到结果
        raise HTTPException(status_code=404, detail="未找到对应数据")  # 抛出 404 异常
    return result  # 返回查询结果










"""
    新增生成器
    - data: 生成器数据（dict，建议用 schema）
    - db: 数据库会话
    - 返回: 1=成功，0=失败
    """
# 新增生成器接口，POST 请求
# 前端请求方式：POST /ACGN_Personal_Preference_Table_Generator/
# 请求体需传递生成器数据（建议为 JSON 格式），如：
# {
#   "name": "xxx",
#   "main_content": "xxx",
#   "data_source_number": 1
# }
@router.post("/", summary="新增生成器")
def create_generator(
    data: dict,  # 请求体参数，生成器数据（建议用 Pydantic schema 替代 dict）
    db: Session = Depends(get_db)  # 依赖注入数据库会话
) -> int:  # 返回值类型为 int，1=成功，0=失败
    try:
        return generator_service.create_generator(db, data)  # 调用 service 层方法新增
    except ValueError as e:  # 捕获业务异常
        raise HTTPException(status_code=400, detail=str(e))  # 抛出 400 异常











"""
    更新生成器
    - id: 主键ID
    - name/main_content/data_source_number: 可选字段
    - db: 数据库会话
    - 返回: 1=成功，0=失败
    """
# 更新生成器接口，PUT 请求
# 前端请求方式：PUT /ACGN_Personal_Preference_Table_Generator/{id}
# 路径参数 id，body 可选字段 name、main_content、data_source_number
# 如：
# {
#   "name": "xxx",
#   "main_content": "xxx",
#   "data_source_number": 2
# }
@router.put("/{id}", summary="更新生成器")
def update_generator(
    id: int,  # 路径参数，主键 ID
    name: Optional[str] = None,  # 可选参数，生成器名称
    main_content: Optional[str] = None,  # 可选参数，主要内容
    data_source_number: Optional[int] = None,  # 可选参数，数据源编号
    db: Session = Depends(get_db)  # 依赖注入数据库会话
) -> int:  # 返回值类型为 int，1=成功，0=失败
    try:
        return generator_service.update_generator(db, id, name, main_content, data_source_number)  # 调用 service 层方法更新
    except ValueError as e:  # 捕获业务异常
        raise HTTPException(status_code=404, detail=str(e))  # 抛出 404 异常











"""
    删除生成器
    - id: 主键ID
    - db: 数据库会话
    - 返回: 1=成功，0=失败
    """
# 删除生成器接口，DELETE 请求
# 前端请求方式：DELETE /ACGN_Personal_Preference_Table_Generator/{id}
# 需传递路径参数 id，如 /ACGN_Personal_Preference_Table_Generator/1
@router.delete("/{id}", summary="删除生成器")
def delete_generator(
    id: int,  # 路径参数，主键 ID
    db: Session = Depends(get_db)  # 依赖注入数据库会话
) -> int:  # 返回值类型为 int，1=成功，0=失败
    try:
        return generator_service.delete_generator(db, id)  # 调用 service 层方法删除
    except ValueError as e:  # 捕获业务异常
        raise HTTPException(status_code=404, detail=str(e))  # 抛出 404 异常