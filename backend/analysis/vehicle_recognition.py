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
    
    # Priority list of vision models (including OpenRouter auto-router openrouter/free)
    models = [
        "openrouter/free",
        "meta-llama/llama-3.2-11b-vision-instruct:free",
        "qwen/qwen2.5-vl-32b-instruct:free",
        "google/gemma-3-4b-it:free",
        "mistralai/mistral-small-3.1-24b-instruct:free",
        "google/gemma-4-26b-a4b-it:free"
    ]
    
    prompt_text = """Identify the vehicle in this image.
Return only in this format:
Brand: <Manufacturer/Company name, e.g. Toyota, Honda, Tesla, BMW, Ford>
Model: <Model name, e.g. Civic, Model 3, Camry, Mustang>
Type: <e.g. Sedan, SUV, Truck, Hatchback, Motorcycle>
Confidence: <High, Medium, or Low>

If you cannot determine the exact brand or model, write Unknown."""

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
                                "text": prompt_text
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
                timeout=20
            )
            content = response.choices[0].message.content
            if content and ("brand:" in content.lower() or "model:" in content.lower()):
                return content
            elif content:
                return content
        except Exception as e:
            last_error = e
            continue
            
    # Graceful fallback instead of crashing
    print(f"[vehicle_recognition] Notice: OpenRouter fallback used due to: {last_error}")
    return "Brand: Unknown\nModel: Unknown\nType: Car\nConfidence: Low"