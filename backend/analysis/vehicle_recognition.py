import os
from pathlib import Path
from openai import OpenAI
import config

# Load .env variables
env_file = Path(__file__).resolve().parent.parent / ".env"
if env_file.exists():
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

# Vision-capable models on OpenRouter (ordered by fallback preference)
VEHICLE_AI_MODELS = [
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "openai/gpt-4o-mini",
]

def get_openai_client():
    api_key = os.getenv("OPENROUTER_API_KEY")
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )

def recognize_vehicle(image_base64):
    client = get_openai_client()

    prompt_text = (
        "Identify the vehicle in this image.\n"
        "Return only in this format:\n"
        "Brand: <Manufacturer/Company name, e.g. Toyota, Honda, Tesla, BMW, Ford>\n"
        "Model: <Model name, e.g. Civic, Model 3, Camry, Mustang>\n"
        "Type: <e.g. Sedan, SUV, Truck, Hatchback, Motorcycle>\n"
        "Confidence: <High, Medium, or Low>\n\n"
        "If you cannot determine the exact brand or model, write Unknown."
    )

    models_to_try = getattr(config, "VEHICLE_AI_MODELS", VEHICLE_AI_MODELS)
    last_error = None

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt_text},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                },
                            },
                        ],
                    }
                ],
                timeout=getattr(config, "VEHICLE_AI_TIMEOUT", 15),
            )
            content = response.choices[0].message.content
            if content:
                return content
        except Exception as e:
            last_error = e
            continue

    print(f"[vehicle_recognition] Notice: all models failed, last error: {last_error}")
    return "Brand: Unknown\nModel: Unknown\nType: Car\nConfidence: Low"