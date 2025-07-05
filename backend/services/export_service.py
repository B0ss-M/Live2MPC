import os
import shutil
import tempfile
import zipfile
from typing import List


class ExportService:
    """Create kit archives from XPM files and samples."""

    def create_kit_archive(
        self,
        xpm_file_path: str,
        sample_paths: List[str],
        program_type: str,
        program_name: str,
    ) -> str:
        temp_dir = tempfile.mkdtemp()
        kit_dir = os.path.join(temp_dir, program_name)
        os.makedirs(kit_dir, exist_ok=True)

        shutil.copy(xpm_file_path, os.path.join(kit_dir, os.path.basename(xpm_file_path)))
        samples_dir = os.path.join(kit_dir, "samples")
        os.makedirs(samples_dir, exist_ok=True)

        for path in sample_paths:
            shutil.copy(path, os.path.join(samples_dir, os.path.basename(path)))

        archive_path = os.path.join(temp_dir, f"{program_name}.zip")
        with zipfile.ZipFile(archive_path, "w") as zf:
            for root, _, files in os.walk(kit_dir):
                for f in files:
                    full_path = os.path.join(root, f)
                    zf.write(full_path, arcname=os.path.relpath(full_path, kit_dir))

        shutil.rmtree(kit_dir)
        return archive_path
