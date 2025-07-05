from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List
import os
import shutil
import tempfile

from ..services.preview_generator_service import PreviewGeneratorService

router = APIRouter()
preview_service = PreviewGeneratorService()


@router.post("/generate-preview/")
async def generate_preview_route(
    background_tasks: BackgroundTasks,
    xpm_file: UploadFile = File(...),
    sample_files: List[UploadFile] = File(...),
):
    """Generate an audio preview from an XPM file and its samples."""
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

        preview_output = os.path.join(temp_dir, "preview.wav")
        success = preview_service.generate_preview(
            xpm_path=xpm_path,
            samples_directory=samples_dir,
            output_path=preview_output,
        )

        if not success or not os.path.exists(preview_output):
            raise HTTPException(status_code=400, detail="Failed to generate preview")

        background_tasks.add_task(shutil.rmtree, temp_dir)
        return FileResponse(
            path=preview_output,
            media_type="audio/wav",
            filename="preview.wav",
            background=background_tasks,
        )
    except Exception as e:
        shutil.rmtree(temp_dir)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during preview generation: {e}")
