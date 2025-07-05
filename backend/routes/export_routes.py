{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {
        "id": "view-in-github",
        "colab_type": "text"
      },
      "source": [
        "<a href=\"https://colab.research.google.com/github/B0ss-M/Live2MPC/blob/main/backend/routes/export_routes.py\" target=\"_parent\"><img src=\"https://colab.research.google.com/assets/colab-badge.svg\" alt=\"Open In Colab\"/></a>"
      ]
    },
    {
      "cell_type": "code",
      "source": [
        "import os\n",
        "import shutil\n",
        "import tempfile\n",
        "from typing import List\n",
        "from fastapi import APIRouter, File, UploadFile, Form, HTTPException\n",
        "from fastapi.responses import FileResponse\n",
        "from backend.services.export_service import ExportService\n",
        "\n",
        "router = APIRouter()\n",
        "export_service = ExportService()\n",
        "\n",
        "@router.post(\"/export-kit/\")\n",
        "async def export_kit_route(\n",
        "    xpm_file: UploadFile = File(...),\n",
        "    sample_files: List[UploadFile] = File(...),\n",
        "    program_type: str = Form(...),\n",
        "    program_name: str = Form(...)\n",
        "):\n",
        "    \"\"\"\n",
        "    Accepts an XPM, samples, and settings, then returns a complete, fixed kit as a zip file.\n",
        "    \"\"\"\n",
        "    if program_type not in ['instrument', 'drum']:\n",
        "        raise HTTPException(status_code=400, detail=\"program_type must be 'instrument' or 'drum'\")\n",
        "\n",
        "    temp_dir = tempfile.mkdtemp()\n",
        "    try:\n",
        "        # Save XPM\n",
        "        xpm_path = os.path.join(temp_dir, xpm_file.filename)\n",
        "        with open(xpm_path, \"wb\") as buffer:\n",
        "            shutil.copyfileobj(xpm_file.file, buffer)\n",
        "\n",
        "        # Save Samples\n",
        "        sample_paths = []\n",
        "        for sample in sample_files:\n",
        "            path = os.path.join(temp_dir, sample.filename)\n",
        "            with open(path, \"wb\") as buffer:\n",
        "                shutil.copyfileobj(sample.file, buffer)\n",
        "            sample_paths.append(path)\n",
        "\n",
        "        # Create the kit archive\n",
        "        archive_path = export_service.create_kit_archive(\n",
        "            xpm_file_path=xpm_path,\n",
        "            sample_paths=sample_paths,\n",
        "            program_type=program_type,\n",
        "            program_name=program_name\n",
        "        )\n",
        "\n",
        "        # The archive is created in a different temp location, so we must clean that up too\n",
        "        return FileResponse(path=archive_path, media_type='application/zip', filename=f\"{program_name}.zip\", background=lambda: os.remove(archive_path))\n",
        "    finally:\n",
        "        shutil.rmtree(temp_dir)"
      ],
      "outputs": [],
      "execution_count": null,
      "metadata": {
        "id": "-5ZS-EwwEqbf"
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