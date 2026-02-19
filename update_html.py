import re

file_path = '/Users/drew/Desktop/Proyecto Solar Oracle/solar-oracle-analyzer.html'

# The new Green Design HTML content
new_results_html = """
    <div class="results-section" id="resultsSection" style="display: none;">
        
        <!-- Header Green -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 40px 20px 60px 20px; border-radius: 0 0 40px 40px; text-align: center; color: white; margin: -20px -20px 20px -20px;">
            <div style="font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px;">ANÁLISIS COMPLETADO</div>
            <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">Tu Potencial Solar ☀️</h2>
            <p style="opacity: 0.9; font-size: 14px;">Basado en tu boleta <span id="distributorName">detectada</span></p>
        </div>

        <!-- Metric Cards Overlay -->
        <div class="container" style="margin-top: -50px; padding: 0 10px; position:relative; z-index:10; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- Saving Card -->
                <div class="glass-card" style="padding: 15px; text-align: center; background: white; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Ahorro 1er Año</div>
                    <div style="font-size: 20px; font-weight: 800; color: #10b981;" id="savings1y">$-</div>
                    <div style="font-size: 9px; color: #10b981; background: #ecfdf5; padding: 2px 6px; border-radius: 10px; display: inline-block; margin-top: 5px;">Recomendado</div>
                </div>
                <!-- Loss Card -->
                <div class="glass-card" style="padding: 15px; text-align: center; border-bottom: 3px solid #f43f5e; background: white; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Pérdida 5 Años</div>
                    <div style="font-size: 20px; font-weight: 800; color: #f43f5e;" id="savings5y">$-</div>
                    <div style="font-size: 9px; color: #9f1239; margin-top: 5px;">Si no haces nada</div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="container" style="padding: 0 10px;">

            <!-- Battery Opportunity (Phase 2) -->
            <div id="batteryCard" class="glass-card" style="overflow: hidden; margin-bottom: 20px; display:none; background: white; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); padding: 15px; color: white; display: flex; align-items: center; gap: 10px;">
                    <div style="font-size: 24px;">🔋</div>
                    <div>
                        <div style="font-weight: 700; font-size: 14px;">Oportunidad de Batería</div>
                        <div style="font-size: 11px; opacity: 0.9;">Maximiza tu ahorro nocturno</div>
                    </div>
                </div>
                <div style="padding: 15px;">
                    <p style="font-size: 13px; color: #334155; margin-bottom: 10px;">
                        Estás perdiendo <strong style="color: #ef4444;" id="batteryLossAmount">$-</strong> mensuales al regalar energía a la red.
                    </p>
                    <div style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 8px;">
                        💡 <strong>Consejo:</strong> Una batería inteligente podría guardar esa energía.
                    </div>
                </div>
            </div>

            <!-- Details List -->
            <h3 style="font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; padding-left: 5px;">
                <span style="width: 4px; height: 16px; background: #10b981; border-radius: 2px;"></span>
                Detalles del Suministro
            </h3>
            
            <div class="glass-card" style="padding: 0 20px; margin-bottom: 25px; background: white; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 13px;">Cliente N°</span>
                    <span style="font-weight: 600; color: #1e293b; font-size: 13px;" id="clientNumber">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 13px;">Consumo Mes</span>
                    <span style="font-weight: 600; color: #1e293b; font-size: 13px;" id="consumption">- kWh</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 13px;">Tarifa Detectada</span>
                    <span style="font-weight: 600; color: #1e293b; font-size: 13px;" id="currentRate">$-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 15px 0;">
                    <span style="color: #64748b; font-size: 13px;">Ubicación</span>
                    <span style="font-weight: 600; color: #1e293b; font-size: 13px;" id="locationField">-</span>
                </div>
            </div>

            <!-- TE4 Roadmap -->
            <div class="roadmap-section" style="margin-bottom: 25px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 15px; padding-left: 5px;">Camino a la Independencia 🚀</h3>
                <div class="glass-card" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                     <!-- Step 1 -->
                     <div style="text-align: center; opacity: 0.5;">
                         <div style="font-size: 18px; margin-bottom: 5px;">📝</div>
                         <div style="font-size: 9px; font-weight: 700;">Firma</div>
                     </div>
                     <div style="flex:1; height: 2px; background: #e2e8f0; margin: 0 8px;"></div>
                     <!-- Step 2 -->
                     <div style="text-align: center; opacity: 0.5;">
                         <div style="font-size: 18px; margin-bottom: 5px;">🔌</div>
                         <div style="font-size: 9px; font-weight: 700;">Solicitud</div>
                     </div>
                     <div style="flex:1; height: 2px; background: #e2e8f0; margin: 0 8px;"></div>
                     <!-- Step 3 (Active) -->
                     <div style="text-align: center;">
                         <div style="width: 28px; height: 28px; background: #ecfdf5; border: 2px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; margin: 0 auto 5px;">📜</div>
                         <div style="font-size: 9px; font-weight: 700; color: #10b981;">TE4 (SEC)</div>
                     </div>
                     <div style="flex:1; height: 2px; background: #e2e8f0; margin: 0 8px;"></div>
                     <!-- Step 4 -->
                     <div style="text-align: center; opacity: 0.5;">
                         <div style="font-size: 18px; margin-bottom: 5px;">⚡</div>
                         <div style="font-size: 9px; font-weight: 700;">Medidor</div>
                     </div>
                </div>
            </div>

            <!-- CTA Actions -->
            <div style="display: flex; gap: 10px; flex-direction: column; margin-bottom: 40px;">
                <button id="downloadPdfButton" style="width: 100%; padding: 18px; border: none; border-radius: 16px; background: #10b981; color: white; font-weight: 700; font-size: 16px; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;">
                    <span>📥</span> Descargar Informe PDF
                </button>
                <div style="text-align:center;">
                    <a href="#" id="whatsappCta" target="_blank" style="color: #64748b; font-size: 14px; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 5px;">
                        <span>💬</span> ¿Dudas? Hablar con experto
                    </a>
                </div>
                <button id="resetButton" style="width: 100%; padding: 15px; border: none; border-radius: 16px; background: transparent; color: #94a3b8; font-weight: 600; margin-top: 10px; cursor: pointer;">
                    Analizar otra boleta
                </button>
            </div>

            <div style="text-align: center; margin-bottom: 40px; font-size: 11px; color: #cbd5e1;">
                SolarOracle Intelligence v4.2
            </div>

        </div>
    </div>
"""

# HTML for the Modal (Keeping the existing one or satisfying requirements)
email_modal_html = """
<div class="modal-overlay" id="emailModal">
    <div class="modal-content" style="border-radius: 20px; font-family: 'Outfit', sans-serif;">
        <button class="modal-close" id="closeModal">✕</button>
        <div class="success-message" id="successMessage">✓ ¡Email guardado! Descargando...</div>
        <h2 class="modal-title" style="color: #1e293b;">📧 Recibe tu Análisis</h2>
        <p class="modal-subtitle">Ingresa tu email para descargar el análisis completo en PDF</p>
        <form class="email-form" id="emailForm">
            <div class="form-group">
                <label class="form-label" for="userEmail">Email</label>
                <input type="email" id="userEmail" class="form-input" placeholder="tu@email.com" required style="border-radius: 12px; padding: 12px;">
                <span class="error-message" id="emailError">Email inválido</span>
            </div>
            <div class="form-group">
                <label class="form-label" for="userName">Nombre (opcional)</label>
                <input type="text" id="userName" class="form-input" placeholder="Tu nombre" style="border-radius: 12px; padding: 12px;">
            </div>
            <div class="form-group">
                <label class="form-label" for="userPhone">Teléfono (opcional)</label>
                <input type="tel" id="userPhone" class="form-input" placeholder="+56 9 1234 5678" style="border-radius: 12px; padding: 12px;">
            </div>
            <button type="button" class="download-button" id="submitEmail" onclick="handleDownload(event)" style="border-radius: 12px; background: #10b981; font-weight: 700;">DESCARGAR PDF</button>
        </form>
    </div>
</div>
"""

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to capture the start of Results Section up to the script tag
    # We rely on 'id="resultsSection"' being unique.
    # We want to replace everything from <div ... id="resultsSection">... up to ...<script>console.log...
    
    # Looking at the file dump: 
    # ...</div><div class="results-section" id="resultsSection" ... script>
    
    # We need to find the start of the div
    start_tag = '<div class="results-section" id="resultsSection"'
    end_tag = '<script>'
    
    start_idx = content.find(start_tag)
    if start_idx == -1:
        # Try matching any variance
        match = re.search(r'<div[^>]*id="resultsSection"[^>]*>', content)
        if match:
            start_idx = match.start()
        else:
            raise Exception("Could not find resultsSection")

    # Find the script tag AFTER the start_idx
    end_idx = content.find(end_tag, start_idx)
    if end_idx == -1:
        # Maybe it's uppercase
        end_idx = content.find('<SCRIPT>', start_idx)
        if end_idx == -1:
             raise Exception("Could not find script tag after resultsSection")

    # Double check we are not eating too much
    # The snippet showed the results section going all the way to the script tag, closing with many </div>
    # My replacement html closes its own divs.
    # The modal is also appended.
    
    # CAREFUL: The original code had: ...</div></div><script>
    # We need to make sure we close the container if the resultsSection was inside a container that IS NOT closed by resultsSection itself.
    # In line 1622: ...</div></div><!-- Verification Modal removed (dead code) --><div class="results-section" id="resultsSection">
    # The preceding divs seem to close previous sections.
    # `resultsSection` is a sibling of `terminal`?
    # `terminal` was inside `container`.
    # Let's verify if `resultsSection` is inside `container`.
    # The `grep_search` output showed: `...<div class="terminal" ...>...</div></div></div>` (multiple closes).
    # Then `<div class="results-section"...`
    
    # Actually, let's look at the structure again.
    # `<body><div class="container">...`
    # `<div class="upload-container">...</div>`
    # `<div class="terminal">...</div>`
    # Then `resultsSection`.
    # It seems `resultsSection` IS inside `container` if `container` is the main wrapper.
    # If I replace `resultsSection` block, I need to make sure I don't remove the closing `</div>` for the `container` or `body` if they were included in the "end_tag" logic.
    
    # The original file has `...</div></div><script>`.
    # One `div` closes `modal-overlay`.
    # One `div` closes `resultsSection`.
    # One `div` closes `container`.
    # One `div` closes `body`? No, body closes at end of file usually.
    
    # My new `resultsSection` has a closing `</div>`.
    # My `email_modal_html` has a closing `</div>`.
    # Those two are siblings.
    # They should be inside `container` ideally.
    # If the original `end_idx` is at `<script>`, we are cutting off everything before it.
    # The original text before `<script>` ends with `</div></div></div></div></div>` (many divs).
    # `modal-overlay` closes.
    # `emailModal` closes.
    # `resultsSection` closes.
    # `container` closes?
    
    # I should simply insert the `</div>` for container manually at the end of my replacement if needed.
    # But `resultsSection` had `display:none`.
    
    # Let's play it safe. I will keep the very last `</div>` before `<script>` if I assume that's the container closer.
    # But counting divs is hard in regex.
    
    # Alternative:
    # `resultsSection` starts at `start_idx`.
    # It ends... well, where does it end?
    # The old structure:
    # <div id="resultsSection">... <div id="emailModal"> ... </div> ... </div> (results closes) ... </div> (container closes?)
    
    # If I replace from `start_idx` to `end_idx`, I wipe out all closing divs.
    # So I must provide the closing divs.
    # My new code provides 1 closing div for Results, 1 for Modal.
    # I need to close the Container.
    # I will add an extra `</div>` at the end of the content just to be safe, or 2.
    # Wait, if I have too many closing divs, it's usually benign (browser ignores), but too few breaks layout.
    # The snippet in Step 355 showed: `...</div></div><script>` (2 divs).
    # Step 352 showed: `...</div></div></div></div></div><script>` (5 divs).
    # The Step 355 view ended at line 1680? No, Step 355 view was lines 1610-1680 but it showed the massive line 1622/1624.
    # The snippet 352 has `</div></div></div></div></div>` (5 divs).
    # 1. successMessage div? No.
    # 2. modal-content div
    # 3. modal-overlay div
    # 4. resultsSection div
    # 5. container div
    # So yes, we need to close the `container` too (and maybe `body` if it closed there, but usually `body` closes after script).
    
    # My replacement has:
    # `new_results_html` (closes itself).
    # `email_modal_html` (closes itself).
    # I need 1 more `</div>` for the container.
    
    final_replacement = new_results_html + email_modal_html + "\n</div>" # Closing the main container
    
    # Doing the replacement
    new_content = content[:start_idx] + final_replacement + content[end_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Successfully updated HTML.")

except Exception as e:
    print(f"Error: {e}")
