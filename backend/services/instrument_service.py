from pathlib import Path
from typing import Dict, Any, List
import shutil
import xml.etree.ElementTree as ET

INSTRUMENTS_DIR = Path("instruments")
INSTRUMENTS_DIR.mkdir(exist_ok=True)


def create_instrument(data: Dict[str, Any]) -> Dict[str, Any]:
    instrument_name = data.get("name", "UnnamedInstrument")
    keygroups: List[Dict[str, Any]] = data.get("keygroups", [])
    instrument_path = INSTRUMENTS_DIR / instrument_name
    instrument_path.mkdir(exist_ok=True)

    # Copy samples into instrument directory
    for kg in keygroups:
        src = Path(kg.get("file"))
        if src.exists():
            shutil.copy(src, instrument_path / src.name)
            kg["file"] = src.name

    # Build simple XPM representation
    xpm_path = instrument_path / f"{instrument_name}.xpm"
    root = ET.Element("Instrument", name=instrument_name)
    for kg in keygroups:
        kg_el = ET.SubElement(root, "Keygroup", key=str(kg.get("key", 60)))
        ET.SubElement(kg_el, "Sample").text = kg.get("file", "")
    ET.ElementTree(root).write(xpm_path)

    return {"instrument": instrument_name, "path": str(instrument_path), "xpm": str(xpm_path)}
