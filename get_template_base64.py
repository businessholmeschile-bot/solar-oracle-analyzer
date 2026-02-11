import base64

image_path = '/Users/drew/.gemini/antigravity/brain/c3366e28-6c92-4bfc-b50f-5380fc68bbe9/solar_oracle_report_template_1770736795444.png'

with open(image_path, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    print(f"data:image/png;base64,{encoded_string}")
