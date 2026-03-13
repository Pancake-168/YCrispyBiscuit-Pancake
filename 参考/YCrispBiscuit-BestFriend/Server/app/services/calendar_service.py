# 导入SQLAlchemy的AsyncSession类，用于异步数据库操作
from sqlalchemy.ext.asyncio import AsyncSession
# 导入Calendar的mapper类，用于处理日历事件的业务逻辑
from app.mappers.calendar_mapper import CalendarMapper
# 定义CalendarService类，用于处理日历事件的业务逻辑
from app.schemas.calendar_schema import CalendarEvent
from app.entities.calendar import CalendarEventEntity
from typing import List, Dict, Optional, Any
import uuid



class CalendarService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_events(self):
        try:
            mapper = CalendarMapper(self.db)
            entities = await mapper.get_all_events()
            # 用 from_orm 自动映射
            return [CalendarEvent.from_orm(entity) for entity in entities]
        except Exception as e:
            raise ValueError(f"Failed to get all events: {str(e)}")

    # 定义异步方法delete_events，用于批量删除日历事件
    async def delete_events(self, event_ids: List[str]) -> int:
        try:
            # 初始化删除计数
            deleted_count = 0
            # 创建mapper实例
            mapper = CalendarMapper(self.db)
            # 循环删除每个id
            for event_id in event_ids:
                # 调用mapper的delete_event方法
                if await mapper.delete_event(event_id):
                    # 如果删除成功，计数加1
                    deleted_count += 1
            # 返回成功删除的数量
            return deleted_count
        except Exception as e:
            raise ValueError(f"Failed to delete events: {str(e)}")
    

    async def create_or_update_event(self, event: CalendarEvent) -> CalendarEvent:
        try:
            mapper = CalendarMapper(self.db)
            if event.id:
                # 更新现有事件
                # 转换Schema到Entity
                entity = CalendarEventEntity(
                    id=event.id,
                    title=event.title,
                    content=event.content,
                    type=event.type.value,
                    importance=event.importance.value,
                    repeat=event.repeat.value,
                    weekdays=event.weekdays,
                    range=event.range,
                    startYear=event.startYear,
                    startMonth=event.startMonth,
                    startDay=event.startDay,
                    startTimeHour=event.startTimeHour,
                    startTimeMinute=event.startTimeMinute,
                    endYear=event.endYear,
                    endMonth=event.endMonth,
                    endDay=event.endDay,
                    endTimeHour=event.endTimeHour,
                    endTimeMinute=event.endTimeMinute,
                    status=event.status.value,
                )
                # 调用mapper更新
                updated_entity = await mapper.update_event(event.id, entity)
                # 用 from_orm 自动映射
                return CalendarEvent.from_orm(updated_entity)
            else:
                # 创建新事件
                # 生成UUID作为ID
                event_id = str(uuid.uuid4())
                # 转换Schema到Entity
                entity = CalendarEventEntity(
                    id=event_id,
                    title=event.title,
                    content=event.content,
                    type=event.type.value,
                    importance=event.importance.value,
                    repeat=event.repeat.value,
                    weekdays=event.weekdays,
                    range=event.range,
                    startYear=event.startYear,
                    startMonth=event.startMonth,
                    startDay=event.startDay,
                    startTimeHour=event.startTimeHour,
                    startTimeMinute=event.startTimeMinute,
                    endYear=event.endYear,
                    endMonth=event.endMonth,
                    endDay=event.endDay,
                    endTimeHour=event.endTimeHour,
                    endTimeMinute=event.endTimeMinute,
                    status=event.status.value,
                )
                # 调用mapper创建
                created_entity = await mapper.create_event(entity)
                # 用 from_orm 自动映射
                return CalendarEvent.from_orm(created_entity)
        except Exception as e:
            raise ValueError(f"Failed to create or update event: {str(e)}")    