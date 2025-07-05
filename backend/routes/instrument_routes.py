from fastapi import APIRouter
from ..services.instrument_service import create_instrument

router = APIRouter()

@router.post("/create-instrument")
async def create_instrument_endpoint(data: dict):
    return create_instrument(data)

