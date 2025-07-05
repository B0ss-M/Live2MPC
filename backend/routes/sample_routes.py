from fastapi import APIRouter, UploadFile, File
from pathlib import Path
import shutil

router = APIRouter()

SAMPLES_DIR = Path("samples")
SAMPLES_DIR.mkdir(exist_ok=True)

@router.post("/upload-samples")
async def upload_samples(files: list[UploadFile] = File(...)):
    saved = []
    for upload in files:
        dest = SAMPLES_DIR / upload.filename
        with dest.open("wb") as out_file:
            shutil.copyfileobj(upload.file, out_file)
        saved.append(dest.name)
    return {"saved": saved}

