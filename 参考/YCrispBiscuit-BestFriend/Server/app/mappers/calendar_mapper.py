# 导入SQLAlchemy的select、update、delete函数，用于构建查询
from sqlalchemy import select, update, delete
# 导入selectinload，用于预加载关系
from sqlalchemy.orm import selectinload
# 导入AsyncSession类，用于异步数据库操作
from sqlalchemy.ext.asyncio import AsyncSession
# 导入CalendarEventEntity，用于数据库查询
from app.entities.calendar import CalendarEventEntity


# 定义CalendarMapper类，用于封装日历事件的数据库查询逻辑
class CalendarMapper:
    # 构造函数，接收数据库会话db
    def __init__(self, db: AsyncSession):
        self.db = db

    # 定义异步方法get_all_events，用于获取所有日历事件
    async def get_all_events(self):
        try:
            # 构建查询：选择CalendarEventEntity
            stmt = select(CalendarEventEntity)
            # 执行查询
            result = await self.db.execute(stmt)
            # 获取所有结果，返回实体列表
            return result.scalars().all()
        except Exception as e:
            raise ValueError(f"Failed to get all events: {str(e)}")

    # 定义异步方法delete_event，用于删除指定id的日历事件
    async def delete_event(self, event_id: str) -> bool:
        try:
            # 构建删除查询：删除CalendarEventEntity中id等于event_id的记录
            stmt = delete(CalendarEventEntity).where(CalendarEventEntity.id == event_id)
            # 执行删除
            result = await self.db.execute(stmt)
            # 返回是否删除了记录（rowcount > 0）
            return result.rowcount > 0
        except Exception as e:
            raise ValueError(f"Failed to delete event: {str(e)}")

    # 定义异步方法create_event，用于创建新日历事件
    async def create_event(self, entity: CalendarEventEntity) -> CalendarEventEntity:
        try:
            # 添加实体到数据库
            self.db.add(entity)
            # 提交事务
            await self.db.commit()
            # 刷新实体，获取数据库生成的字段
            await self.db.refresh(entity)
            # 返回创建的实体
            return entity
        except Exception as e:
            raise ValueError(f"Failed to create event: {str(e)}")

    # 定义异步方法get_event_by_id，用于获取指定id的日历事件
    async def get_event_by_id(self, event_id: str) -> CalendarEventEntity:
        try:
            stmt = select(CalendarEventEntity).where(CalendarEventEntity.id == event_id)
            result = await self.db.execute(stmt)
            return result.scalar_one()
        except Exception as e:
            raise ValueError(f"Failed to get event by id: {str(e)}")

    # 定义异步方法update_event，用于更新指定id的日历事件
    async def update_event(self, event_id: str, entity: CalendarEventEntity) -> CalendarEventEntity:
        try:
            # 更新主表字段
            update_stmt = update(CalendarEventEntity).where(CalendarEventEntity.id == event_id).values(
                title=entity.title,
                content=entity.content,
                type=entity.type,
                importance=entity.importance,
                repeat=entity.repeat,
                weekdays=entity.weekdays,
                range=entity.range,
                startYear=entity.startYear,
                startMonth=entity.startMonth,
                startDay=entity.startDay,
                startTimeHour=entity.startTimeHour,
                startTimeMinute=entity.startTimeMinute,
                endYear=entity.endYear,
                endMonth=entity.endMonth,
                endDay=entity.endDay,
                endTimeHour=entity.endTimeHour,
                endTimeMinute=entity.endTimeMinute,
                status=entity.status,
            )
            await self.db.execute(update_stmt)

            # 提交事务
            await self.db.commit()
            # 返回更新后的实体
            return await self.get_event_by_id(event_id)
        except Exception as e:
            raise ValueError(f"Failed to update event: {str(e)}")