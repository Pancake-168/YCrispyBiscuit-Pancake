from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import auth, user
from app.api.routes import ACGN_Personal_Preference_Table_Generator
from app.api.routes import Data_Source_ACGN_Personal_Preference_Table_Generator
from app.api.routes import Documentations
app = FastAPI()


# 挂载静态资源目录
app.mount("/static", StaticFiles(directory="resources"), name="static")



# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173"],  # 允许的前端源
     allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(ACGN_Personal_Preference_Table_Generator.router)
app.include_router(Data_Source_ACGN_Personal_Preference_Table_Generator.router)
app.include_router(Documentations.router)

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}
