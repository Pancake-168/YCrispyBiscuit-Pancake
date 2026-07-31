from pydantic import BaseModel  # Field 提供 default_factory


class BilibiliLoginUrlResponse(BaseModel):
    """GET /api/bilibili_login/url 的响应体。"""

    qrcode_key: str  # 二维码唯一 key，用于后续轮询
    url: str  # B站登录页 URL（二维码内容）
    qrcode_image: str  # 通过 qrserver API 生成的二维码图片 URL
