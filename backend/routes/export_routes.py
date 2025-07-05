from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from typing import List
import os
import shutil
import tempfile

from ..services.export_service import ExportService

router = APIRouter()
export_service = ExportService()


@router.post("/export-kit/")
async def export_kit_route(
    xpm_file: UploadFile = File(...),
    sample_files: List[UploadFile] = File(...),
    program_type: str = Form(...),
    program_name: str = Form(...),
):
    """Return a zip archive containing the fixed kit."""
    if program_type not in {"instrument", "drum"}:
        raise HTTPException(status_code=400, detail="program_type must be 'instrument' or 'drum'")

    temp_dir = tempfile.mkdtemp()
    try:
        xpm_path = os.path.join(temp_dir, xpm_file.filename)
        with open(xpm_path, "wb") as buffer:
            shutil.copyfileobj(xpm_file.file, buffer)

        sample_paths = []
        for sample in sample_files:
            spath = os.path.join(temp_dir, sample.filename)
            with open(spath, "wb") as buffer:
                shutil.copyfileobj(sample.file, buffer)
            sample_paths.append(spath)

        archive_path = export_service.create_kit_archive(
            xpm_file_path=xpm_path,
            sample_paths=sample_paths,
            program_type=program_type,
            program_name=program_name,
        )

        return FileResponse(
            path=archive_path,
            media_type="application/zip",
            filename=f"{program_name}.zip",
            background=lambda: os.remove(archive_path),
        )
    finally:
        shutil.rmtree(temp_dir)
