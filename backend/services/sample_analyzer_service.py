from typing import Optional
from pydantic import BaseModel
import numpy as np
import librosa


class SampleAnalysis(BaseModel):
    pitch: Optional[str]
    key: Optional[str]


class SampleAnalyzerService:
    """Analyze audio samples for pitch and key information."""

    def analyze_sample(self, file_path: str) -> SampleAnalysis:
        y, sr = librosa.load(file_path, sr=None)
        pitch = self.detect_pitch(y, sr)
        key = self.detect_key(y, sr)
        return SampleAnalysis(pitch=pitch, key=key)

    def detect_pitch(self, y: np.ndarray, sr: int) -> Optional[str]:
        f0, voiced_flag, _ = librosa.pyin(
            y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C7")
        )
        if voiced_flag.any():
            median_f0 = np.median(f0[voiced_flag])
            if np.isnan(median_f0):
                return None
            midi = librosa.hz_to_midi(median_f0)
            return librosa.midi_to_note(midi)
        return None

    def detect_key(self, y: np.ndarray, sr: int) -> Optional[str]:
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = chroma.mean(axis=1)
        key_index = int(chroma_mean.argmax())
        key_map = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        return key_map[key_index]
