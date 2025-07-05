from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import List, Optional
import os
import shutil
import tempfile

from ..services.sample_management_service import SampleManagementService

router = APIRouter()
management_service = SampleManagementService()


@router.post("/validate-rename/")
async def validate_and_rename_route(
    files: List[UploadFile] = File(...),
    program_type: str = Form(...),
    base_name: Optional[str] = Form(None),
):
    """Validate samples and suggest new names."""
    if program_type not in {"instrument", "drum"}:
        raise HTTPException(status_code=400, detail="program_type must be 'instrument' or 'drum'")

    temp_dir = tempfile.mkdtemp()
    sample_paths = []
    try:
        for file in files:
            path = os.path.join(temp_dir, file.filename)
            with open(path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            sample_paths.append(path)

        results = management_service.validate_and_rename_samples(
            sample_paths=sample_paths,
            program_type=program_type,
            base_name=base_name or "Instrument",
        )
        return results
    finally:
        shutil.rmtree(temp_dir)
