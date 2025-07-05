from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import Response
from typing import List, Dict, Any
from backend.services.expansion_builder_service import ExpansionBuilderService

router = APIRouter()
builder_service = ExpansionBuilderService()

@router.post("/build-expansion-xml/")
async def build_expansion_xml_route(
    expansion_name: str = Body(...),
    programs_data: List[Dict[str, Any]] = Body(...)
):
    """
    Accepts expansion details and program data, then returns a generated
    expansion.xml file.
    """
    try:
        xml_content = builder_service.create_expansion_xml(
            expansion_name=expansion_name,
            programs_data=programs_data
        )
        
        return Response(
            content=xml_content,
            media_type="application/xml",
            headers={"Content-Disposition": f"attachment; filename=expansion.xml"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while building the expansion XML: {str(e)}")

