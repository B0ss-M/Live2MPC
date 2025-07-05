from fastapi import APIRouter, UploadFile, File
from ..services.sample_analyzer_service import SampleAnalyzerService
from tempfile import NamedTemporaryFile
import shutil

router = APIRouter()

analyzer = SampleAnalyzerService()


@router.post("/analyze-sample")
async def analyze_sample(file: UploadFile = File(...)):
    with NamedTemporaryFile(delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    result = analyzer.analyze_sample(tmp_path)
    return result.dict()
