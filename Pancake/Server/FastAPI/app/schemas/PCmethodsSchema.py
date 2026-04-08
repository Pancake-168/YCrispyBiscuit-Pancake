from pydantic import BaseModel


class PCmethodsFolder(BaseModel):
    name: str
    path: str


class PCmethodsWorkflowResponse(BaseModel):
    name: str
    folder: list[PCmethodsFolder] = []


class PCmethodsOpenResponse(BaseModel):
    message: str