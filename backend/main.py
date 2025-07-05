from fastapi import FastAPI
from backend.routes import (
    drumkit_routes,
    instrument_routes,
    sample_routes,
    analysis_routes,
    xpm_fixer_routes,
    preview_routes,
    sample_management_routes,
    export_routes,
    expansion_builder_routes # <-- ADD THIS IMPORT
)

app = FastAPI(
    title="Live2MPC App",
    description="API for creating and managing MPC instruments and drum kits.",
    version="0.3.0"
)

# Include the routers
app.include_router(drumkit_routes.router, prefix="/api", tags=["Drum Kits"])
app.include_router(instrument_routes.router, prefix="/api", tags=["Instruments"])
app.include_router(sample_routes.router, prefix="/api", tags=["Samples"])
app.include_router(analysis_routes.router, prefix="/api", tags=["Analysis"])
app.include_router(xpm_fixer_routes.router, prefix="/api", tags=["XPM Fixer"])
app.include_router(preview_routes.router, prefix="/api", tags=["Preview"])
app.include_router(sample_management_routes.router, prefix="/api", tags=["Sample Management"])
app.include_router(export_routes.router, prefix="/api", tags=["Export"])
app.include_router(expansion_builder_routes.router, prefix="/api", tags=["Expansion Builder"]) # <-- ADD THIS LINE

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the Live2MPC API"}
