from pydantic import BaseModel
from pydantic import ConfigDict


class HealthResponse(BaseModel):
    status: str

    # Pydantic v2: enable loading from ORM-like objects if needed
    model_config = ConfigDict(from_attributes=True)
