from pathlib import Path
from typing import Dict, Any

INSTRUMENTS_DIR = Path("instruments")
INSTRUMENTS_DIR.mkdir(exist_ok=True)


def create_instrument(data: Dict[str, Any]) -> Dict[str, Any]:
    instrument_name = data.get("name", "UnnamedInstrument")
    instrument_path = INSTRUMENTS_DIR / instrument_name
    instrument_path.mkdir(exist_ok=True)
    # TODO: generate keygroup mapping and preview
    return {"instrument": instrument_name, "path": str(instrument_path)}

