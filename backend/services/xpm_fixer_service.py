{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {
        "id": "view-in-github",
        "colab_type": "text"
      },
      "source": [
        "<a href=\"https://colab.research.google.com/github/B0ss-M/Live2MPC/blob/main/backend/services/xpm_fixer_service.py\" target=\"_parent\"><img src=\"https://colab.research.google.com/assets/colab-badge.svg\" alt=\"Open In Colab\"/></a>"
      ]
    },
    {
      "cell_type": "code",
      "source": [
        "import os\n",
        "import xml.etree.ElementTree as ET\n",
        "from typing import List\n",
        "\n",
        "class XpmFixerService:\n",
        "    \"\"\"\n",
        "    A service to fix broken sample paths in MPC .xpm program files.\n",
        "    \"\"\"\n",
        "\n",
        "    def fix_xpm(self, xpm_path: str, samples_directory: str) -> str:\n",
        "        \"\"\"\n",
        "        Parses an XPM file, corrects broken sample paths, and saves a new fixed version.\n",
        "\n",
        "        Args:\n",
        "            xpm_path: The file path to the .xpm program file.\n",
        "            samples_directory: The directory where the user's samples are located.\n",
        "\n",
        "        Returns:\n",
        "            The file path of the newly created, fixed .xpm file.\n",
        "        \"\"\"\n",
        "        try:\n",
        "            # Register the 'Akai' namespace to avoid it being prefixed in the output\n",
        "            ET.register_namespace('Akai', 'http://www.akaipro.com/xpm')\n",
        "\n",
        "            tree = ET.parse(xpm_path)\n",
        "            root = tree.getroot()\n",
        "\n",
        "            available_samples = [f for f in os.listdir(samples_directory) if os.path.isfile(os.path.join(samples_directory, f))]\n",
        "\n",
        "            # The structure is Program -> Instruments -> Instrument -> Layers -> Layer\n",
        "            # We need to find all <Layer> elements\n",
        "            for layer in root.findall('.//{http://www.akaipro.com/xpm}Layer'):\n",
        "                sample_file_name_element = layer.find('{http://www.akaipro.com/xpm}sampleFileName')\n",
        "\n",
        "                if sample_file_name_element is not None and sample_file_name_element.text:\n",
        "                    original_sample_path = sample_file_name_element.text\n",
        "                    # Extract the base filename from the path stored in the XPM\n",
        "                    base_filename = os.path.basename(original_sample_path)\n",
        "\n",
        "                    # Check if the exact file path exists\n",
        "                    if not os.path.exists(original_sample_path):\n",
        "                        # If not, try to find a matching filename in the provided samples directory\n",
        "                        if base_filename in available_samples:\n",
        "                            # If found, update the element's text to the correct relative path\n",
        "                            # MPC often uses relative paths from the program file.\n",
        "                            # For simplicity, we'll just use the filename.\n",
        "                            # A more robust solution might construct a proper relative path.\n",
        "                            sample_file_name_element.text = base_filename\n",
        "                            print(f\"Fixed sample path: '{original_sample_path}' -> '{base_filename}'\")\n",
        "                        else:\n",
        "                            print(f\"Warning: Could not find a match for sample: '{base_filename}'\")\n",
        "\n",
        "            # Create a path for the new, fixed XPM file\n",
        "            directory, original_filename = os.path.split(xpm_path)\n",
        "            new_filename = f\"{os.path.splitext(original_filename)[0]}_fixed.xpm\"\n",
        "            fixed_xpm_path = os.path.join(directory, new_filename)\n",
        "\n",
        "            # Write the modified XML tree to the new file\n",
        "            tree.write(fixed_xpm_path, encoding='utf-8', xml_declaration=True)\n",
        "\n",
        "            return fixed_xpm_path\n",
        "\n",
        "        except ET.ParseError as e:\n",
        "            print(f\"Error parsing XPM file: {e}\")\n",
        "            raise ValueError(f\"Could not parse the XPM file: {xpm_path}\")\n",
        "        except Exception as e:\n",
        "            print(f\"An unexpected error occurred in XpmFixerService: {e}\")\n",
        "            raise"
      ],
      "outputs": [],
      "execution_count": null,
      "metadata": {
        "id": "nLE6oFDzCnqI"
      }
    }
  ],
  "metadata": {
    "colab": {
      "provenance": [],
      "include_colab_link": true
    },
    "kernelspec": {
      "display_name": "Python 3",
      "name": "python3"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 0
}