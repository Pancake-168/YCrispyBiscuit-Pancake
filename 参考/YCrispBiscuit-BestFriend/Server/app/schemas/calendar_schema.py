from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from enum import Enum


class EventTypeEnum(str, Enum):
    DEFAULT = "default"
    MEETING = "meeting"
    BIRTHDAY = "birthday"
    HOLIDAY = "holiday"
    DEADLINE = "deadline"
    GOAL = "goal"


class ImportanceEnum(str, Enum):
    R = "R"
    SR = "SR"
    SSR = "SSR"
    SP = "SP"


class RepeatEnum(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class StatusEnum(str, Enum):
    NORMAL = "normal"
    COMPLETED = "completed"
    CANCELED = "canceled"


class CalendarEvent(BaseModel):
    id: Optional[str] = None  # 创建时可选，后端生成
    title: str
    content: Optional[str] = None  # 日历内容

    type: EventTypeEnum  # 事件类型
    importance: ImportanceEnum  # 重要性

    repeat: RepeatEnum  # 重复类型
    weekdays: Optional[List[int]] = None  # 可选，repeat为weekly时使用，0表示星期天，1表示星期一，依此类推

    range: Optional[bool] = None  # 可选，是否为跨天事件
    # 拆分后的日期字段
    startYear: Optional[int] = None
    startMonth: Optional[int] = None
    startDay: Optional[int] = None
    endYear: Optional[int] = None
    endMonth: Optional[int] = None
    endDay: Optional[int] = None
    # 拆分后的时间字段
    startTimeHour: Optional[int] = None
    startTimeMinute: Optional[int] = None
    endTimeHour: Optional[int] = None
    endTimeMinute: Optional[int] = None

    status: StatusEnum  # 可选，事件状态

    model_config = ConfigDict(from_attributes=True)