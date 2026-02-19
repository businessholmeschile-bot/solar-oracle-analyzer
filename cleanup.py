import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove dashboard-section
content = re.sub(r'<!-- SECTION: DASHBOARD -->.*?<!-- ============================================================ -->', '<!-- ============================================================ -->', content, flags=re.DOTALL)

# 2. Remove matrix-section
content = re.sub(r'<!-- SECTION: MATRIX -->.*?</section>', '<!-- MATRIX SECTION REMOVED -->', content, flags=re.DOTALL)

# 3. Change oracle-section to not be hidden
content = content.replace('<section id="oracle-section" class="hidden animate-fade-in">', '<section id="oracle-section" class="animate-fade-in">')

# 4. Remove ROADMAP_ITEMS from script
content = re.sub(r'const ROADMAP_ITEMS = \[.*?\];', '', content, flags=re.DOTALL)

# 5. Simplify checkPass
new_check_pass = """function checkPass() {
        const pass = document.getElementById("admin-pass").value;
        if (!pass) return;
        AUTH_TOKEN = pass;
        
        // Entrance
        document.getElementById("login-overlay").style.opacity = "0";
        setTimeout(
            () => document.getElementById("login-overlay").remove(),
            500,
        );
        loadOracleData();
      }"""
content = re.sub(r'function checkPass\(\) \{.*?\}\s*\}', new_check_pass, content, flags=re.DOTALL)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
