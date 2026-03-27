import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.library_service import library_service

router = APIRouter()

@router.post("/scan")
def scan_library(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Start scanning the music library"""
    background_tasks.add_task(library_service.scan_library, db)
    return {"message": "Library scan started in background"}

@router.get("/stats")
def get_library_stats(db: Session = Depends(get_db)):
    """Get library statistics"""
    stats = library_service.get_library_stats(db)
    return stats

@router.get("/scan/status")
def get_scan_status():
    """Get current scan status"""
    return library_service.get_scan_status()

@router.post("/rescan")
def rescan_library(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Rescan library (clear and rescan)"""
    background_tasks.add_task(library_service.rescan_library, db)
    return {"message": "Library rescan started in background"}