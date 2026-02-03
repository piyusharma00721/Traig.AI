import google.generativeai as genai
import json
from app.core.config import settings
from fastapi import UploadFile

class LLMService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        if self.provider == "gemini":
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            self.model = genai.GenerativeModel('gemini-2.5-flash') # Using Pro for better accuracy and stability

    async def analyze_report(self, file: UploadFile):
        content = await file.read()
        
        system_prompt = """
        You are an expert medical lab analyst assisting a patient via 'Traig.AI'.
        Analyze the provided image of a CBC (Complete Blood Count) report.
        
        Extract the following information and return it in valid JSON format:
        1. "summary": A patient-friendly summary of the report. What does it indicate?
        2. "abnormal_findings": A list of parameters that are out of range (High/Low).
        3. "suggestions": General actionable improvement suggestions (diet, lifestyle).
        4. "extracted_data": An array of objects, each containing:
            - "parameter": Name of the test (e.g., Hemoglobin, WBC).
            - "value": The result value as shown (string).
            - "numerical_value": The result value converted to a pure number (float) for charting. If N/A, use null.
            - "unit": The unit of measurement.
            - "reference_range": The normal range.
            - "status": "Normal", "High", or "Low".
            - "impact": A brief explanation of how this specific level affects health (1 sentence).
            - "advice": Specific advice to normalize this specific parameter (food/action).

        Ensure the output is pure JSON without markdown backticks.
        """

        try:
            if self.provider == "gemini":
                # Gemini accepts bytes directly in some SDK versions, but let's be safe and use part objects
                response = self.model.generate_content([
                    {'mime_type': file.content_type, 'data': content},
                    system_prompt
                ])
                
                # Simple cleanup to ensure JSON
                text_response = response.text.strip()
                if text_response.startswith("```json"):
                    text_response = text_response[7:-3].strip()
                elif text_response.startswith("```"):
                    text_response = text_response[3:-3].strip()
                
                return json.loads(text_response)
                
            # (Optional) Add OpenAI implementation here if needed
            
        except Exception as e:
            return {"error": str(e)}

llm_service = LLMService()
