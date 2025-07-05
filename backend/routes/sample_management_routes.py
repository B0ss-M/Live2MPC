{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {
        "id": "view-in-github",
        "colab_type": "text"
      },
      "source": [
        "<a href=\"https://colab.research.google.com/github/B0ss-M/Live2MPC/blob/main/backend/routes/sample_management_routes.py\" target=\"_parent\"><img src=\"https://colab.research.google.com/assets/colab-badge.svg\" alt=\"Open In Colab\"/></a>"
      ]
    },
    {
      "cell_type": "code",
      "source": [
        "import os\n",
        "import shutil\n",
        "import tempfile\n",
        "from typing import List, Optional\n",
        "from fastapi import APIRouter, File, UploadFile, Form, HTTPException\n",
        "from backend.services.sample_management_service import SampleManagementService\n",
        "\n",
        "router = APIRouter()\n",
        "management_service = SampleManagementService()\n",
        "\n",
        "@router.post(\"/validate-rename/\")\n",
        "async def validate_and_rename_route(\n",
        "    files: List[UploadFile] = File(...),\n",
        "    program_type: str = Form(...),\n",
        "    base_name: Optional[str] = Form(None)\n",
        "):\n",
        "    \"\"\"\n",
        "    Accepts samples, validates them, analyzes them, and suggests new names.\n",
        "    \"\"\"\n",
        "    if program_type not in ['instrument', 'drum']:\n",
        "        raise HTTPException(status_code=400, detail=\"program_type must be 'instrument' or 'drum'\")\n",
        "\n",
        "    temp_dir = tempfile.mkdtemp()\n",
        "    sample_paths = []\n",
        "    try:\n",
        "        for file in files:\n",
        "            path = os.path.join(temp_dir, file.filename)\n",
        "            with open(path, \"wb\") as buffer:\n",
        "                shutil.copyfileobj(file.file, buffer)\n",
        "            sample_paths.append(path)\n",
        "\n",
        "        results = management_service.validate_and_rename_samples(\n",
        "            sample_paths=sample_paths,\n",
        "            program_type=program_type,\n",
        "            base_name=base_name or \"Instrument\"\n",
        "        )\n",
        "        return results\n",
        "    finally:\n",
        "        shutil.rmtree(temp_dir)"
      ],
      "outputs": [],
      "execution_count": null,
      "metadata": {
        "id": "5fz6JUF2EWU1"
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