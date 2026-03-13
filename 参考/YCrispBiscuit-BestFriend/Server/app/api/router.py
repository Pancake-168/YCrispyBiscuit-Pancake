from fastapi import APIRouter

from app.controllers import health_controller
from app.controllers import ProjectApis_controller
from app.controllers import system_info_controller
from app.controllers import LLM_Online_controller
from app.controllers import user_controller
from app.controllers import calendar_controller


router = APIRouter()

# Mount feature routers here
router.include_router(health_controller.router, prefix="/api")
router.include_router(ProjectApis_controller.router, prefix="/api")
router.include_router(LLM_Online_controller.router, prefix="/api")
router.include_router(system_info_controller.router)
router.include_router(user_controller.router, prefix="/api/auth")
router.include_router(calendar_controller.router, prefix="/api")