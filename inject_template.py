import base64
import os

html_path = '/Users/drew/Desktop/Proyecto Solar Oracle/solar-oracle-analyzer.html'
image_path = '/Users/drew/.gemini/antigravity/brain/c3366e28-6c92-4bfc-b50f-5380fc68bbe9/solar_oracle_report_template_1770736795444.png'

# Read Image
with open(image_path, "rb") as image_file:
    b64_str = base64.b64encode(image_file.read()).decode('utf-8')

# Read HTML
with open(html_path, "r") as f:
    content = f.read()

# Check if already injected
if "const PDF_TEMPLATE_BASE64 =" in content:
    print("Template already injected. Skipping.")
    exit(0)

# Injection Marker: We'll insert it at the start of the generatePDF function or global scope
marker = "// --- CONSTANTS & CONFIG ---"
injection_code = f"\n            const PDF_TEMPLATE_BASE64 = 'data:image/png;base64,{b64_str}';\n"

if marker in content:
    new_content = content.replace(marker, marker + injection_code)
else:
    # Fallback: Insert before the SCRIPT_URL definition
    fallback_marker = "const SCRIPT_URL ="
    new_content = content.replace(fallback_marker, injection_code + "\n            " + fallback_marker)

with open(html_path, "w") as f:
    f.write(new_content)

print("Successfully injected PDF_TEMPLATE_BASE64 into solar-oracle-analyzer.html")
