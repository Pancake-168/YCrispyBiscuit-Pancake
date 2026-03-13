import os
import json
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

router = APIRouter()
load_dotenv(dotenv_path=".env.development")  # 或根据环境选择 .env.production

host = os.environ["HOST"]  # 如果没有设置，会直接抛出 KeyError
port = os.environ["PORT"]



@router.get("/getApiPages", response_model=list[dict])
async def get_api_pages():
    try:
        return load_apis()
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")



def load_apis():
    with open("json/Apis.json", "r", encoding="utf-8") as f:
        apis = json.load(f)
    base = f"http://{host}:{port}"
    for api in apis:
        api["url"] = f"{base}{api['url']}"
    return apis