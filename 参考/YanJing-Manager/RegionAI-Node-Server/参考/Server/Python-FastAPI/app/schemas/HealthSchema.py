from pydantic import BaseModel
from pydantic import ConfigDict
class HealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    status: str