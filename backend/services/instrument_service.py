from pathlib import Path
from typing import Dict, Any, List
import shutil
import xml.etree.ElementTree as ET

INSTRUMENTS_DIR = Path("instruments")
INSTRUMENTS_DIR.mkdir(exist_ok=True)


def create_instrument(data: Dict[str, Any]) -> Dict[str, Any]:
    instrument_name = data.get("name", "UnnamedInstrument")
    samples: List[str] = data.get("samples", [])
    instrument_path = INSTRUMENTS_DIR / instrument_name
    instrument_path.mkdir(exist_ok=True)

    for sample in samples:
        src = Path("samples") / sample
        if src.exists():
            shutil.copy(src, instrument_path / sample)

    root = ET.Element("KeygroupInstrument")
    for i, sample in enumerate(samples):
        ET.SubElement(
            root,
            "Sample",
            filename=sample,
            midi_note=str(60 + i),
        )

    tree = ET.ElementTree(root)
    xpm_path = instrument_path / f"{instrument_name}.xpm"
    tree.write(xpm_path, encoding="utf-8", xml_declaration=True)

    return {
        "instrument": instrument_name,
        "path": str(instrument_path),
        "xpm": str(xpm_path),
    }

