import os

base64_file_path = 'logo_base64.txt'
html_file_path = 'solar-oracle-analyzer.html'

# Read Base64
with open(base64_file_path, 'r') as f:
    base64_content = f.read().strip()

# Read HTML
with open(html_file_path, 'r') as f:
    html_content = f.read()

# Replace Placeholder
if 'LOGO_BASE64_PLACEHOLDER' in html_content:
    new_html_content = html_content.replace('LOGO_BASE64_PLACEHOLDER', base64_content)
    
    # Write HTML back
    with open(html_file_path, 'w') as f:
        f.write(new_html_content)
    
    print("Successfully injected logo base64.")
else:
    print("Placeholder LOGO_BASE64_PLACEHOLDER not found in HTML.")
