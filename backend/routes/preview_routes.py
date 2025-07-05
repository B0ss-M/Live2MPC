{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {
        "id": "view-in-github",
        "colab_type": "text"
      },
      "source": [
        "<a href=\"https://colab.research.google.com/github/B0ss-M/Live2MPC/blob/main/backend/routes/preview_routes.py\" target=\"_parent\"><img src=\"https://colab.research.google.com/assets/colab-badge.svg\" alt=\"Open In Colab\"/></a>"
      ]
    },
    {
      "cell_type": "code",
      "source": [
        "import os\n",
        "import shutil\n",
        "import tempfile\n",
        "from typing import List\n",
        "from fastapi import APIRouter, File, UploadFile, HTTPException\n",
        "from fastapi.responses import FileResponse\n",
        "from backend.services.preview_generator_service import PreviewGeneratorService\n",
        "\n",
        "router = APIRouter()\n",
        "preview_service = PreviewGeneratorService()\n",
        "\n",
        "@router.post(\"/generate-preview/\")\n",
        "async def generate_preview_route(xpm_file: UploadFile = File(...), sample_files: List[UploadFile] = File(...)):\n",
        "    \"\"\"\n",
        "    Accepts an XPM file and its samples, then generates and returns an audio preview.\n",
        "    \"\"\"\n",
        "    temp_dir = tempfile.mkdtemp()\n",
        "\n",
        "    try:\n",
        "        # Save XPM file\n",
        "        xpm_file_path = os.path.join(temp_dir, xpm_file.filename)\n",
        "        with open(xpm_file_path, \"wb\") as buffer:\n",
        "            shutil.copyfileobj(xpm_file.file, buffer)\n",
        "\n",
        "        # Save sample files\n",
        "        samples_dir = os.path.join(temp_dir, \"samples\")\n",
        "        os.makedirs(samples_dir)\n",
        "        for sample_file in sample_files:\n",
        "            sample_path = os.path.join(samples_dir, sample_file.filename)\n",
        "            with open(sample_path, \"wb\") as buffer:\n",
        "                shutil.copyfileobj(sample_file.file, buffer)\n",
        "\n",
        "        # Define the output path for the preview\n",
        "        preview_output_path = os.path.join(temp_dir, \"preview.wav\")\n",
        "\n",
        "        # Generate the preview\n",
        "        success = preview_service.generate_preview(\n",
        "            xpm_path=xpm_file_path,\n",
        "            samples_directory=samples_dir,\n",
        "            output_path=preview_output_path\n",
        "        )\n",
        "\n",
        "        if not success or not os.path.exists(preview_output_path):\n",
        "            raise HTTPException(status_code=400, detail=\"Failed to generate preview. Check if the XPM and samples are valid.\")\n",
        "\n",
        "        # Return the generated preview file\n",
        "        return FileResponse(path=preview_output_path, media_type='audio/wav', filename=\"preview.wav\", background=lambda: shutil.rmtree(temp_dir))\n",
        "\n",
        "    except Exception as e:\n",
        "        shutil.rmtree(temp_dir)\n",
        "        raise HTTPException(status_code=500, detail=f\"An unexpected error occurred during preview generation: {str(e)}\")"
      ],
      "outputs": [],
      "execution_count": null,
      "metadata": {
        "id": "FVPiUxjwDhfM"
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