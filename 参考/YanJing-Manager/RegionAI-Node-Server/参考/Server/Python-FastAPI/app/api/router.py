from fastapi import APIRouter

from app.controllers import HealthController
from app.controllers import UserController
from app.controllers import PCmethods
from app.controllers import WeatherController

router = APIRouter()


router.include_router(HealthController.router, prefix="/api")
router.include_router(UserController.router, prefix="/api")
router.include_router(PCmethods.router, prefix="/api")
router.include_router(WeatherController.router, prefix="/api")
