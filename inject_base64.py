
import os

# Paths
base64_file_path = 'output.txt'
html_file_path = 'solar-oracle-analyzer.html'

# Read Base64
with open(base64_file_path, 'r') as f:
    base64_content = f.read().strip()

# Read HTML
with open(html_file_path, 'r') as f:
    html_content = f.read()

# Replace Placeholder
new_html_content = html_content.replace('BASE64_PLACEHOLDER', base64_content)

# Write HTML back
with open(html_file_path, 'w') as f:
    f.write(new_html_content)

print("Successfully injected base64 image into HTML.")
