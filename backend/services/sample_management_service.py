{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {
        "id": "view-in-github",
        "colab_type": "text"
      },
      "source": [
        "<a href=\"https://colab.research.google.com/github/B0ss-M/Live2MPC/blob/main/backend/services/sample_management_service.py\" target=\"_parent\"><img src=\"https://colab.research.google.com/assets/colab-badge.svg\" alt=\"Open In Colab\"/></a>"
      ]
    },
    {
      "cell_type": "code",
      "source": [
        "import os\n",
        "import re\n",
        "from typing import List, Dict, Any\n",
        "from backend.services.sample_analyzer_service import SampleAnalyzerService, SampleAnalysis\n",
        "\n",
        "class SampleManagementService:\n",
        "    \"\"\"\n",
        "    Provides services for validating and renaming samples based on their content and program type.\n",
        "    \"\"\"\n",
        "    def __init__(self):\n",
        "        self.analyzer = SampleAnalyzerService()\n",
        "\n",
        "    def _sanitize_filename(self, name: str) -> str:\n",
        "        \"\"\"Removes special characters and replaces spaces with underscores.\"\"\"\n",
        "        name = re.sub(r'[^\\w\\s.-]', '', name)\n",
        "        return re.sub(r'\\s+', '_', name)\n",
        "\n",
        "    def _create_instrument_name(self, base_name: str, analysis: SampleAnalysis, original_filename: str) -> str:\n",
        "        \"\"\"Creates a new filename for an instrument sample, embedding the pitch.\"\"\"\n",
        "        if analysis.pitch:\n",
        "            # Sanitize the pitch string (e.g., \"C#4\" -> \"Csharp4\") to be fs-friendly\n",
        "            safe_pitch = analysis.pitch.replace('#', 'sharp')\n",
        "            # Get the original file extension\n",
        "            extension = os.path.splitext(original_filename)[1]\n",
        "            return f\"{base_name}_{safe_pitch}{extension}\"\n",
        "        else:\n",
        "            # If no pitch is detected, return the sanitized original name\n",
        "            return self._sanitize_filename(original_filename)\n",
        "\n",
        "    def validate_and_rename_samples(\n",
        "        self,\n",
        "        sample_paths: List[str],\n",
        "        program_type: str,\n",
        "        base_name: str = \"Instrument\"\n",
        "    ) -> List[Dict[str, Any]]:\n",
        "        \"\"\"\n",
        "        Analyzes, validates, and suggests new names for a list of samples.\n",
        "\n",
        "        Args:\n",
        "            sample_paths: A list of file paths to the samples.\n",
        "            program_type: The type of program ('instrument' or 'drum').\n",
        "            base_name: The base name for new instrument files.\n",
        "\n",
        "        Returns:\n",
        "            A list of dictionaries, each containing details about a sample.\n",
        "        \"\"\"\n",
        "        results = []\n",
        "        for sample_path in sample_paths:\n",
        "            original_filename = os.path.basename(sample_path)\n",
        "            validation_report = {\"original_filename\": original_filename, \"valid\": True, \"errors\": []}\n",
        "\n",
        "            # 1. Validation\n",
        "            if not os.path.exists(sample_path):\n",
        "                validation_report[\"valid\"] = False\n",
        "                validation_report[\"errors\"].append(\"File not found.\")\n",
        "                results.append(validation_report)\n",
        "                continue\n",
        "\n",
        "            # For now, we'll just check if it's a .wav, but more checks can be added.\n",
        "            if not original_filename.lower().endswith('.wav'):\n",
        "                validation_report[\"valid\"] = False\n",
        "                validation_report[\"errors\"].append(\"Invalid format: not a .wav file.\")\n",
        "\n",
        "            # 2. Analysis\n",
        "            analysis = self.analyzer.analyze_sample(sample_path)\n",
        "            if not analysis.pitch and program_type == 'instrument':\n",
        "                 validation_report[\"errors\"].append(\"Warning: Could not detect pitch for instrument sample.\")\n",
        "\n",
        "            # 3. Renaming\n",
        "            if program_type == 'instrument':\n",
        "                new_name = self._create_instrument_name(base_name, analysis, original_filename)\n",
        "            else: # 'drum' program\n",
        "                new_name = self._sanitize_filename(original_filename)\n",
        "\n",
        "            results.append({\n",
        "                \"original_filename\": original_filename,\n",
        "                \"new_filename\": new_name,\n",
        "                \"analysis\": analysis.dict(),\n",
        "                \"validation\": validation_report\n",
        "            })\n",
        "\n",
        "        return results"
      ],
      "outputs": [],
      "execution_count": null,
      "metadata": {
        "id": "ZqKWgQVuEHwi"
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