import os
import xml.etree.ElementTree as ET
from typing import List


class XpmFixerService:
    """Fix broken sample paths in MPC .xpm program files."""

    def fix_xpm(self, xpm_path: str, samples_directory: str) -> str:
        """Parse an XPM file and correct sample paths using files from ``samples_directory``.

        Returns path to the fixed XPM file.
        """
        try:
            ET.register_namespace("Akai", "http://www.akaipro.com/xpm")
            tree = ET.parse(xpm_path)
            root = tree.getroot()

            available = {
                f: os.path.join(samples_directory, f)
                for f in os.listdir(samples_directory)
                if os.path.isfile(os.path.join(samples_directory, f))
            }

            for layer in root.findall('.//{http://www.akaipro.com/xpm}Layer'):
                el = layer.find('{http://www.akaipro.com/xpm}sampleFileName')
                if el is not None and el.text:
                    base = os.path.basename(el.text)
                    if not os.path.exists(el.text) and base in available:
                        el.text = base

            directory, original = os.path.split(xpm_path)
            fixed_path = os.path.join(directory, f"{os.path.splitext(original)[0]}_fixed.xpm")
            tree.write(fixed_path, encoding="utf-8", xml_declaration=True)
            return fixed_path
        except ET.ParseError as e:
            raise ValueError(f"Could not parse the XPM file: {xpm_path}") from e
        except Exception as e:
            raise
