from pathlib import Path
from typing import Dict, Any, List
import shutil
import xml.etree.ElementTree as ET

KITS_DIR = Path("kits")
KITS_DIR.mkdir(exist_ok=True)


def create_drumkit(data: Dict[str, Any]) -> Dict[str, Any]:
    kit_name = data.get("name", "UnnamedKit")
    samples: List[str] = data.get("samples", [])
    kit_path = KITS_DIR / kit_name
    kit_path.mkdir(exist_ok=True)

    # Copy samples into kit directory
    for sample in samples:
        src = Path(sample)
        if src.exists():
            shutil.copy(src, kit_path / src.name)

    # Build minimal XPM file listing samples
    xpm_path = kit_path / f"{kit_name}.xpm"
    root = ET.Element("Drumkit", name=kit_name)
    for idx, sample in enumerate(samples):
        pad = ET.SubElement(root, "Pad", pad=str(idx))
        ET.SubElement(pad, "Sample").text = Path(sample).name
    ET.ElementTree(root).write(xpm_path)

    return {"kit": kit_name, "path": str(kit_path), "xpm": str(xpm_path)}
