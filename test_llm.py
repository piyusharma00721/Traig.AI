import google.generativeai as genai
import os
from dotenv import load_dotenv
import asyncio

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

model = genai.GenerativeModel('gemini-2.5-pro')

async def test():
    print("Testing gemini-2.5-pro...")
    try:
        response = await model.generate_content_async("Hello, can you hear me?")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
