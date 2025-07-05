from fastapi import APIRouter, UploadFile, File
from pathlib import Path
import shutil
from ..utils.sample_utils import analyze_pitch

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


@router.post("/analyze-sample")
async def analyze_sample(file: UploadFile = File(...)):
    dest = SAMPLES_DIR / file.filename
    with dest.open("wb") as out_file:
        shutil.copyfileobj(file.file, out_file)
    analysis = analyze_pitch(dest)
    return analysis

