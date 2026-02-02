from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.llm_service import llm_service

router = APIRouter()

@router.post("/analyze")
async def analyze_report_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    result = await llm_service.analyze_report(file)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return result
