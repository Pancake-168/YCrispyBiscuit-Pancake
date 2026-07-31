from fastapi import APIRouter

# 导入各模块的路由实例（每个 controller 模块导出一个 router）
from app.controllers import HealthController
from app.controllers import UserController
from app.controllers import PictureSwitchController
from app.controllers import PCmethodsController
from app.controllers import WeatherController


# 顶层路由汇总，由 main.py include 到 FastAPI app 上
router = APIRouter()

# 所有 controller 路由统一挂载在 /api 前缀下
router.include_router(HealthController.router, prefix="/api")
router.include_router(UserController.router, prefix="/api")
router.include_router(PictureSwitchController.router, prefix="/api")
router.include_router(PCmethodsController.router, prefix="/api")
router.include_router(WeatherController.router, prefix="/api")
