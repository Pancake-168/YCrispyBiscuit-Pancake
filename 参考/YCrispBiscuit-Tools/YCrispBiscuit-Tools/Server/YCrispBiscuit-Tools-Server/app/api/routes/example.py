# 示例接口路由
from fastapi import APIRouter

# 创建 APIRouter 实例
router = APIRouter()

@router.get("/example")
def example():
    """
    示例接口，返回一条简单消息。
    """
    return {"msg": "This is a custom route."}
