import os
import re
from typing import List, Dict, Any

from .sample_analyzer_service import SampleAnalyzerService, SampleAnalysis


class SampleManagementService:
    """Validate and rename samples based on their content and type."""

    def __init__(self) -> None:
        self.analyzer = SampleAnalyzerService()

    def _sanitize_filename(self, name: str) -> str:
        name = re.sub(r"[^\w\s.-]", "", name)
        return re.sub(r"\s+", "_", name)

    def _create_instrument_name(self, base_name: str, analysis: SampleAnalysis, original_filename: str) -> str:
        if analysis.pitch:
            safe_pitch = analysis.pitch.replace("#", "sharp")
            extension = os.path.splitext(original_filename)[1]
            return f"{base_name}_{safe_pitch}{extension}"
        return self._sanitize_filename(original_filename)

    def validate_and_rename_samples(
        self,
        sample_paths: List[str],
        program_type: str,
        base_name: str = "Instrument",
    ) -> List[Dict[str, Any]]:
        results = []
        for sample_path in sample_paths:
            original_filename = os.path.basename(sample_path)
            report = {"original_filename": original_filename, "valid": True, "errors": []}

            if not os.path.exists(sample_path):
                report["valid"] = False
                report["errors"].append("File not found.")
                results.append(report)
                continue

            if not original_filename.lower().endswith(".wav"):
                report["valid"] = False
                report["errors"].append("Invalid format: not a .wav file.")

            analysis = self.analyzer.analyze_sample(sample_path)
            if not analysis.pitch and program_type == "instrument":
                report["errors"].append("Warning: Could not detect pitch for instrument sample.")

            new_name = (
                self._create_instrument_name(base_name, analysis, original_filename)
                if program_type == "instrument"
                else self._sanitize_filename(original_filename)
            )

            results.append({
                "original_filename": original_filename,
                "new_filename": new_name,
                "analysis": analysis.dict(),
                "validation": report,
            })
        return results
