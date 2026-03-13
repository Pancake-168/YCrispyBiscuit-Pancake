"""实体（Entity）定义，用于日历事件数据模型，使用SQLAlchemy ORM"""

from sqlalchemy import Column, String, Boolean, JSON, Integer
from sqlalchemy.orm import Mapped
from app.core.database import Base


class CalendarEventEntity(Base):
    __tablename__ = "calendar_events"

    id: Mapped[str] = Column(String(50), primary_key=True, index=True)
    title: Mapped[str] = Column(String(200), nullable=False)
    content: Mapped[str] = Column(String(1000), nullable=True)  # 日历内容

    type: Mapped[str] = Column(String(20), nullable=False)  # 事件类型：default, meeting, birthday, holiday, deadline, goal
    importance: Mapped[str] = Column(String(3), nullable=False)  # 重要性：R, SR, SSR, SP

    repeat: Mapped[str] = Column(String(10), nullable=False)  # 重复类型：none, daily, weekly, monthly, yearly
    weekdays: Mapped[list] = Column(JSON, nullable=True)  # 可选，repeat为weekly时使用，0表示星期天，1表示星期一，依此类推

    range: Mapped[bool] = Column(Boolean, nullable=True)  # 可选，是否为跨天事件
    # 拆分后的日期字段
    startYear: Mapped[int] = Column(Integer, nullable=True)
    startMonth: Mapped[int] = Column(Integer, nullable=True)
    startDay: Mapped[int] = Column(Integer, nullable=True)
    endYear: Mapped[int] = Column(Integer, nullable=True)
    endMonth: Mapped[int] = Column(Integer, nullable=True)
    endDay: Mapped[int] = Column(Integer, nullable=True)
    # 拆分后的时间字段
    startTimeHour: Mapped[int] = Column(Integer, nullable=True)
    startTimeMinute: Mapped[int] = Column(Integer, nullable=True)
    endTimeHour: Mapped[int] = Column(Integer, nullable=True)
    endTimeMinute: Mapped[int] = Column(Integer, nullable=True)

    status: Mapped[str] = Column(String(10), nullable=False)  # 可选，事件状态：normal, completed, canceled