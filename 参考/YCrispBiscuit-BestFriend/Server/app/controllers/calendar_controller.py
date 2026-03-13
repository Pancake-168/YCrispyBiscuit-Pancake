# 导入FastAPI的APIRouter类，用于创建和管理API路由
from fastapi import APIRouter, Depends, HTTPException
# 导入typing模块的List类型，用于定义列表类型注解
from typing import List
# 导入CalendarEvent schema，用于定义日历事件的响应模型
from app.schemas.calendar_schema import CalendarEvent
# 导入CalendarService类，用于处理日历事件的业务逻辑
from app.services.calendar_service import CalendarService
# 导入get_db函数，用于获取数据库会话
from app.core.database import get_db
# 导入SQLAlchemy的AsyncSession类，用于异步数据库操作
from sqlalchemy.ext.asyncio import AsyncSession

# 创建APIRouter实例，用于定义日历相关的路由
router = APIRouter()

# 定义GET路由，响应模型为CalendarEvent的列表
@router.get("/calendar/events/get", response_model=List[CalendarEvent])
# 定义异步函数get_all_events，参数db是AsyncSession类型，默认通过Depends依赖注入get_db函数获取
async def get_all_events(db: AsyncSession = Depends(get_db)):
    try:
        # 创建CalendarService实例，传入数据库会话db
        service = CalendarService(db)
        # 调用service的get_all_events方法，获取所有日历事件，并返回结果
        return await service.get_all_events()
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/calendar/events/delete")
async def delete_events(event_ids: List[str], db: AsyncSession = Depends(get_db)):
    try:
        service = CalendarService(db)
        deleted_count = await service.delete_events(event_ids)
        return {"deleted_count": deleted_count}
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/calendar/events/createorupdate",response_model=CalendarEvent)
async def create_or_update_event(event: CalendarEvent, db: AsyncSession = Depends(get_db)):
    try:
        service = CalendarService(db)
        created_event = await service.create_or_update_event(event)
        return created_event
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")