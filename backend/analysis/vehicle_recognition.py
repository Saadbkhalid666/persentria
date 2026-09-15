import os
from pathlib import Path
from openai import OpenAI
import config

 
env_file = Path(__file__).resolve().parent.parent / ".env"
if env_file.exists():
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

DEFAULT_VEHICLE_AI_MODELS = [
    "inclusionai/ling-3.0-flash-vl:free",
    "dots-studio/dots-3-note-preview:free",
    "openrouter/free",
]


def get_openai_client():
    api_key = os.getenv("OPENROUTER_API_KEY")
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )


def recognize_vehicle(image_base64: str) -> str:
    """
    Call vision LLM to identify make, model, type, and confidence of a vehicle crop.
    """
    if not image_base64:
        return "Brand: Unknown\nModel: Unknown\nType: Car\nConfidence: Low"

    client = get_openai_client()

    prompt_text = (
        "Identify the vehicle in this image.\n"
        "Return strictly in this exact format:\n"
        "Brand: <Manufacturer name, e.g. Honda, Toyota, Tesla, BMW, Ford, Mercedes>\n"
        "Model: <Model name, e.g. Civic, Model 3, Camry, Mustang, C-Class>\n"
        "Type: <Body style, e.g. Sedan, SUV, Truck, Hatchback, Motorcycle, Coupe>\n"
        "Confidence: <e.g. High, Medium, or Low>\n\n"
        "If brand or model cannot be identified with certainty, write Unknown for that field."
    )

    if image_base64.startswith("data:image"):
        data_url = image_base64
    else:
        data_url = f"data:image/jpeg;base64,{image_base64}"

    models_to_try = getattr(config, "VEHICLE_AI_MODELS", DEFAULT_VEHICLE_AI_MODELS)
    last_error = None

    for model_name in models_to_try:
        try:
            print(f"[vehicle_recognition] Querying model {model_name}...")
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
                                    "url": data_url
                                },
                            },
                        ],
                    }
                ],
                timeout=getattr(config, "VEHICLE_AI_TIMEOUT", 12),
            )
            content = response.choices[0].message.content
            if content:
                lower = content.lower()
                if "brand:" in lower or "model:" in lower or "make:" in lower:
                    print(f"[vehicle_recognition] Success with {model_name}:\n{content.strip()}")
                    return content
                else:
                    print(f"[vehicle_recognition] Model {model_name} returned non-standard format: {content.strip()[:60]}")
        except Exception as e:
            last_error = e
            print(f"[vehicle_recognition] Model {model_name} failed: {e}")
            continue

    print(f"[vehicle_recognition] Notice: all models failed, last error: {last_error}")
    return "Brand: Unknown\nModel: Unknown\nType: Car\nConfidence: Low"