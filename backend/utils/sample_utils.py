import librosa
from pathlib import Path
from typing import Dict


def analyze_pitch(file_path: Path) -> Dict[str, float]:
    """Analyze a sample and return basic pitch information."""
    y, sr = librosa.load(str(file_path), sr=None)
    # Estimate the fundamental frequency using librosa's yin algorithm
    f0_series = librosa.yin(y, fmin=50, fmax=2000, sr=sr)
    f0 = float(f0_series[0]) if len(f0_series) > 0 else 0.0
    return {"fundamental_freq": f0, "sample_rate": sr}
