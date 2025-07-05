{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {
        "id": "view-in-github",
        "colab_type": "text"
      },
      "source": [
        "<a href=\"https://colab.research.google.com/github/B0ss-M/Live2MPC/blob/main/backend/routes/xpm_fixer_routes.py\" target=\"_parent\"><img src=\"https://colab.research.google.com/assets/colab-badge.svg\" alt=\"Open In Colab\"/></a>"
      ]
    },
    {
      "cell_type": "code",
      "source": [
        "import os\n",
        "import shutil\n",
        "import tempfile\n",
        "from typing import List\n",
        "from fastapi import APIRouter, File, UploadFile, HTTPException, Form\n",
        "from fastapi.responses import FileResponse\n",
        "from backend.services.xpm_fixer_service import XpmFixerService\n",
        "\n",
        "router = APIRouter()\n",
        "fixer_service = XpmFixerService()\n",
        "\n",
        "@router.post(\"/fix-xpm/\")\n",
        "async def fix_xpm_route(xpm_file: UploadFile = File(...), sample_files: List[UploadFile] = File(...)):\n",
        "    \"\"\"\n",
        "    Accepts an XPM file and a list of sample files.\n",
        "    It attempts to fix the sample paths in the XPM file and returns the corrected version.\n",
        "    \"\"\"\n",
        "    # Create a temporary directory to work in\n",
        "    temp_dir = tempfile.mkdtemp()\n",
        "\n",
        "    try:\n",
        "        # Save the uploaded XPM file to the temp directory\n",
        "        xpm_file_path = os.path.join(temp_dir, xpm_file.filename)\n",
        "        with open(xpm_file_path, \"wb\") as buffer:\n",
        "            shutil.copyfileobj(xpm_file.file, buffer)\n",
        "\n",
        "        # Create a subdirectory for samples\n",
        "        samples_dir = os.path.join(temp_dir, \"samples\")\n",
        "        os.makedirs(samples_dir)\n",
        "\n",
        "        # Save all uploaded sample files into the samples subdirectory\n",
        "        for sample_file in sample_files:\n",
        "            sample_path = os.path.join(samples_dir, sample_file.filename)\n",
        "            with open(sample_path, \"wb\") as buffer:\n",
        "                shutil.copyfileobj(sample_file.file, buffer)\n",
        "\n",
        "        # Call the fixer service\n",
        "        fixed_xpm_path = fixer_service.fix_xpm(xpm_path=xpm_file_path, samples_directory=samples_dir)\n",
        "\n",
        "        # Return the fixed file and clean up afterwards\n",
        "        return FileResponse(path=fixed_xpm_path, media_type='application/xml', filename=os.path.basename(fixed_xpm_path), background=lambda: shutil.rmtree(temp_dir))\n",
        "\n",
        "    except ValueError as e:\n",
        "        # Clean up the temp directory in case of a known error\n",
        "        shutil.rmtree(temp_dir)\n",
        "        raise HTTPException(status_code=400, detail=str(e))\n",
        "    except Exception as e:\n",
        "        # Clean up the temp directory in case of an unexpected error\n",
        "        shutil.rmtree(temp_dir)\n",
        "        raise HTTPException(status_code=500, detail=f\"An unexpected error occurred: {str(e)}\")"
      ],
      "outputs": [],
      "execution_count": null,
      "metadata": {
        "id": "SDmRkxqFC08j"
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