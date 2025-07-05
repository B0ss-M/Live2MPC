import os
import xml.etree.ElementTree as ET
from xml.dom import minidom
from typing import List, Dict, Any

class ExpansionBuilderService:
    """
    A service to create an expansion.xml file for an MPC expansion pack.
    """

    def _prettify_xml(self, elem: ET.Element) -> str:
        """
        Return a pretty-printed XML string for the Element.
        """
        rough_string = ET.tostring(elem, 'utf-8')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")

    def create_expansion_xml(
        self,
        expansion_name: str,
        programs_data: List[Dict[str, Any]]
    ) -> str:
        """
        Generates the content of an expansion.xml file.

        Args:
            expansion_name: The name of the expansion pack.
            programs_data: A list of dictionaries, where each dictionary contains
                           details about a program (e.g., name, type, path).

        Returns:
            A string containing the formatted XML content.
        """
        # Create the root element <Expansion>
        root = ET.Element("Expansion", {
            "name": expansion_name,
            "version": "1.0",
            "vendor": "Live2MPC"
        })

        # Create the <Programs> sub-element
        programs_element = ET.SubElement(root, "Programs")

        for prog_data in programs_data:
            # Create a <Program> element for each item
            ET.SubElement(programs_element, "Program", {
                "name": prog_data.get("name", "Unknown"),
                "type": prog_data.get("type", "Keygroup"),
                "path": prog_data.get("path", "")
            })

        # Return the XML as a pretty-formatted string
        return self._prettify_xml(root)

