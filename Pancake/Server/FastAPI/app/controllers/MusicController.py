from fastapi import APIRouter, HTTPException, Depends
from app.services.Music import MusicService
from app.utils.JWT import require_user_id

router = APIRouter()

@router.get("/pancake/user/musiclist", summary="获取用户音乐列表", tags=["Music"])
async def get_user_music_list(
    user_id: str = Depends(require_user_id),
    service: MusicService = Depends(MusicService)
    ):
    try:
        music_list = await service.get_user_music_list(user_id)
        return {"success": True, "data": music_list}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="内部服务器错误：无法获取用户音乐列表")
    
@router.get("/pancake/user/musiclist/{musicListId}", summary="获取指定音乐列表", tags=["Music"])
async def get_music_list_detail(
    musicListId: str,
    user_id: str = Depends(require_user_id),
    service: MusicService = Depends(MusicService)
    ):
    try:
        music_list_detail = await service.get_music_list_detail(user_id, musicListId)
        return {"success": True, "data": music_list_detail}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="内部服务器错误：无法获取音乐列表详情")