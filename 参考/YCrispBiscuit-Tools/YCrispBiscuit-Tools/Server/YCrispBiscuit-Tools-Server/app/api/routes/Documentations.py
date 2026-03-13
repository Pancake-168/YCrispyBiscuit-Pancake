"""
Documentations 相关接口路由
- 仅负责参数接收、权限校验、调用 service 层
"""


# -*- coding: utf-8 -*-  # 指定文件编码
from fastapi import APIRouter, HTTPException  # 导入FastAPI路由和异常
from app.services.Documentations import get_all_Documentations  # 导入service层方法
import os  # 导入os模块


# 创建 APIRouter 实例，设置路由前缀和标签
router = APIRouter(prefix="/Documentations", tags=["Documentations"])




# 获取所有分区及其结构
@router.get('/all', summary="获取所有文档分区及结构")
async def get_partitions():
    return get_all_Documentations()  # 直接返回service层扫描结果




