from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from typing import List
import os
import shutil
import tempfile

from ..services.xpm_fixer_service import XpmFixerService

router = APIRouter()
fixer_service = XpmFixerService()


@router.post("/fix-xpm/")
async def fix_xpm_route(
    xpm_file: UploadFile = File(...),
    sample_files: List[UploadFile] = File(...),
):
    """Fix broken sample paths in an uploaded XPM file."""
    temp_dir = tempfile.mkdtemp()
    try:
        xpm_path = os.path.join(temp_dir, xpm_file.filename)
        with open(xpm_path, "wb") as buffer:
            shutil.copyfileobj(xpm_file.file, buffer)

        samples_dir = os.path.join(temp_dir, "samples")
        os.makedirs(samples_dir, exist_ok=True)
        for sample in sample_files:
            dest = os.path.join(samples_dir, sample.filename)
            with open(dest, "wb") as buffer:
                shutil.copyfileobj(sample.file, buffer)

        fixed_path = fixer_service.fix_xpm(xpm_path=xpm_path, samples_directory=samples_dir)
        return FileResponse(
            path=fixed_path,
            media_type="application/xml",
            filename=os.path.basename(fixed_path),
            background=lambda: shutil.rmtree(temp_dir),
        )
    except ValueError as e:
        shutil.rmtree(temp_dir)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        shutil.rmtree(temp_dir)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
