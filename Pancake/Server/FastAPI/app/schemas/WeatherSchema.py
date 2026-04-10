from typing import Any

from pydantic import BaseModel


class WeatherResponse(BaseModel):
    success: bool
    data: dict[str, Any]
