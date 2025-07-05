from fastapi import FastAPI

from .routes.sample_routes import router as sample_router
from .routes.drumkit_routes import router as drumkit_router
from .routes.instrument_routes import router as instrument_router

app = FastAPI(title="MPC Fixer API")

app.include_router(sample_router, prefix="/api")
app.include_router(drumkit_router, prefix="/api")
app.include_router(instrument_router, prefix="/api")

