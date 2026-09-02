import os
from pathlib import Path
from openai import OpenAI

# Ensure OPENROUTER_API_KEY is loaded from .env
env_file = Path(__file__).resolve().parent.parent / ".env"
if env_file.exists():
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

def get_openai_client():
    api_key = os.getenv("OPENROUTER_API_KEY")
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )

def recognize_vehicle(image_base64):
    client = get_openai_client()
    
    # Candidate vision models with fallback
    models = [
        "google/gemma-4-26b-a4b-it:free",
        "meta-llama/llama-3.2-11b-vision-instruct:free",
        "google/gemini-2.0-flash-exp:free"
    ]
    
    last_error = None
    for model_name in models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Identify the vehicle in this image.
Return only:
Brand: ...
Model: ...
Type: ...
Confidence: ...

If you cannot determine the exact brand or model, write Unknown instead of guessing."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                timeout=25
            )
            return response.choices[0].message.content
        except Exception as e:
            last_error = e
            continue
            
    if last_error:
        raise last_error
    return "Brand: Unknown\nModel: Unknown\nType: Car\nConfidence: Low"