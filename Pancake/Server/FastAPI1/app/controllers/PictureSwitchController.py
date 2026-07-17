"""
图片转换 API 端点。

- GET  /api/picture/formats              支持的格式列表
- POST /api/picture/convert              批量转换（multipart/form-data）
- GET  /api/picture/download/single/{task_id}/{index}  下载单个结果
- GET  /api/picture/download/batch/{task_id}           下载批量 zip
"""

# File=标记为文件字段 Form=标记为表单字段
from fastapi import APIRouter, UploadFile, File, Form  

 # 文件下载响应（设置 Content-Disposition）
from fastapi.responses import FileResponse   
