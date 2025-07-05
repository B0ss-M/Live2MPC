from fastapi import APIRouter
from ..services.drumkit_service import create_drumkit

router = APIRouter()

@router.post("/create-drumkit")
async def create_drumkit_endpoint(data: dict):
    return create_drumkit(data)

