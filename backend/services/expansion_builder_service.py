{
  "cells": [
    {
      "cell_type": "code",
      "source": [
        "import os\n",
        "import xml.etree.ElementTree as ET\n",
        "from xml.dom import minidom\n",
        "from typing import List, Dict, Any\n",
        "\n",
        "class ExpansionBuilderService:\n",
        "    \"\"\"\n",
        "    A service to create an expansion.xml file for an MPC expansion pack.\n",
        "    \"\"\"\n",
        "\n",
        "    def _prettify_xml(self, elem: ET.Element) -> str:\n",
        "        \"\"\"\n",
        "        Return a pretty-printed XML string for the Element.\n",
        "        \"\"\"\n",
        "        rough_string = ET.tostring(elem, 'utf-8')\n",
        "        reparsed = minidom.parseString(rough_string)\n",
        "        return reparsed.toprettyxml(indent=\"  \")\n",
        "\n",
        "    def create_expansion_xml(\n",
        "        self,\n",
        "        expansion_name: str,\n",
        "        programs_data: List[Dict[str, Any]]\n",
        "    ) -> str:\n",
        "        \"\"\"\n",
        "        Generates the content of an expansion.xml file.\n",
        "\n",
        "        Args:\n",
        "            expansion_name: The name of the expansion pack.\n",
        "            programs_data: A list of dictionaries, where each dictionary contains\n",
        "                           details about a program (e.g., name, type, path).\n",
        "\n",
        "        Returns:\n",
        "            A string containing the formatted XML content.\n",
        "        \"\"\"\n",
        "        # Create the root element <Expansion>\n",
        "        root = ET.Element(\"Expansion\", {\n",
        "            \"name\": expansion_name,\n",
        "            \"version\": \"1.0\",\n",
        "            \"vendor\": \"Live2MPC\"\n",
        "        })\n",
        "\n",
        "        # Create the <Programs> sub-element\n",
        "        programs_element = ET.SubElement(root, \"Programs\")\n",
        "\n",
        "        for prog_data in programs_data:\n",
        "            # Create a <Program> element for each item\n",
        "            ET.SubElement(programs_element, \"Program\", {\n",
        "                \"name\": prog_data.get(\"name\", \"Unknown\"),\n",
        "                \"type\": prog_data.get(\"type\", \"Keygroup\"),\n",
        "                \"path\": prog_data.get(\"path\", \"\")\n",
        "            })\n",
        "\n",
        "        # Return the XML as a pretty-formatted string\n",
        "        return self._prettify_xml(root)"
      ],
      "outputs": [],
      "execution_count": null,
      "metadata": {
        "id": "Jr1hGb28XLMh"
      }
    }
  ],
  "metadata": {
    "colab": {
      "provenance": []
    },
    "kernelspec": {
      "display_name": "Python 3",
      "name": "python3"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 0
}