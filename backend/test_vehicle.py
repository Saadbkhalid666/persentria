import base64

from analysis.vehicle_recognition import recognize_vehicle


with open("civic.jpg", "rb") as image:
    image_base64 = base64.b64encode(
        image.read()
    ).decode("utf-8")


result = recognize_vehicle(image_base64)

print("\nVehicle Recognition Result:")
print(result)