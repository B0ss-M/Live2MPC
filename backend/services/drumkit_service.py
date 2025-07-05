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

    # Copy samples into kit folder
    for sample in samples:
        src = Path("samples") / sample
        if src.exists():
            shutil.copy(src, kit_path / sample)

    # Build simple XPM file referencing copied samples
    root = ET.Element("DrumKit")
    for sample in samples:
        ET.SubElement(root, "Sample", filename=sample)

    tree = ET.ElementTree(root)
    xpm_path = kit_path / f"{kit_name}.xpm"
    tree.write(xpm_path, encoding="utf-8", xml_declaration=True)

    return {"kit": kit_name, "path": str(kit_path), "xpm": str(xpm_path)}

