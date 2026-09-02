import os 
from openai import OpenAI

client =  OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

def recognize_vehicle(image_base64):

    response = client.chat.completions.create(
        model="google/gemma-4-26b-a4b-it:free",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
Identify the vehicle in this image.

Return only:
Brand: ...
Model: ...
Type: ...
Confidence: ...

If you cannot determine the exact brand or model,
write Unknown instead of guessing.
"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ]
    )

    return response.choices[0].message.content