import os
import xml.etree.ElementTree as ET
from typing import List, Tuple
from pydub import AudioSegment


class PreviewGeneratorService:
    """Generate simple audio previews for MPC programs."""

    def _get_samples_from_xpm(self, xpm_path: str, samples_directory: str) -> List[Tuple[int, str]]:
        samples: List[Tuple[int, str]] = []
        try:
            tree = ET.parse(xpm_path)
            root = tree.getroot()
            for layer in root.findall('.//{http://www.akaipro.com/xpm}Layer'):
                sample_el = layer.find('{http://www.akaipro.com/xpm}sampleFileName')
                root_note_el = layer.find('{http://www.akaipro.com/xpm}rootNote')
                if sample_el is not None and sample_el.text and root_note_el is not None:
                    sample_filename = os.path.basename(sample_el.text)
                    sample_path = os.path.join(samples_directory, sample_filename)
                    if os.path.exists(sample_path):
                        samples.append((int(root_note_el.text), sample_path))
            samples.sort()
            return samples
        except ET.ParseError:
            return []

    def generate_preview(self, xpm_path: str, samples_directory: str, output_path: str) -> bool:
        program_samples = self._get_samples_from_xpm(xpm_path, samples_directory)
        if not program_samples:
            return False

        samples_to_sequence = program_samples[:4]
        step_duration_ms = 500
        preview = AudioSegment.silent(duration=len(samples_to_sequence) * step_duration_ms)

        for i, (_, sample_path) in enumerate(samples_to_sequence):
            try:
                sample_audio = AudioSegment.from_file(sample_path)
                preview = preview.overlay(sample_audio, position=i * step_duration_ms)
            except Exception:
                continue

        if preview.duration_seconds > 0:
            preview.export(output_path, format="wav")
            return True
        return False
