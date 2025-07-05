from pathlib import Path
from typing import Dict, Any

KITS_DIR = Path("kits")
KITS_DIR.mkdir(exist_ok=True)


def create_drumkit(data: Dict[str, Any]) -> Dict[str, Any]:
    kit_name = data.get("name", "UnnamedKit")
    kit_path = KITS_DIR / kit_name
    kit_path.mkdir(exist_ok=True)
    # TODO: build XPM file and copy samples
    return {"kit": kit_name, "path": str(kit_path)}

