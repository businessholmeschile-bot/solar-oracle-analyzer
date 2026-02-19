// Google Apps Script ACTUALIZADO - SolarOracle Ultimate (DEBUG MODE)
// Funcionalidades:
// 1. Guarda datos en Google Sheet (26 campos)
// 2. Sube boleta a Google Drive (Carpeta 'SolarOracle')
// 3. Envía alerta al ADMIN (solaroracle.cl@gmail.com)
// 4. Envía estudio al CLIENTE (data.email)
// 5. DIAGNÓSTICO: Logs detallados en consola de Google

function doPost(e) {
  const response = { result: 'error', actions: [] };

  try {
    console.log("1. doPost iniciado. Recibiendo datos...");

    // 1. Parsear datos
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No postData found");
    }
    const data = JSON.parse(e.postData.contents);
    console.log("2. JSON Parseado correctamente. Email:", data.email);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error("No se pudo acceder al Spreadsheet activo");

    const sheet = spreadsheet.getActiveSheet();
    if (!sheet) throw new Error("No se pudo acceder a la hoja activa");

    console.log("3. Hoja accedida:", sheet.getName());

    // 2. Encabezados (si es hoja nueva)
    if (sheet.getLastRow() === 0) {
      console.log("3.1. Hoja vacía, creando encabezados...");
      sheet.appendRow([
        'Timestamp', 'Email', 'Nombre', 'Teléfono', 'N° Cliente',
        'Distribuidora', 'Consumo (kWh)', 'Tarifa Actual ($/kWh)', 'Costo Actual ($)',
        'Costo Sistema Est. ($)', 'ROI (Años)', 'Ahorro Anual ($)',
        'Costo Proyectado ($)', 'Aumento Mensual ($)', 'Ahorro Mensual ($)',
        'Ahorro 6 meses ($)', 'Ahorro 5 años ($)',
        'Nombre Archivo', 'Tipo Archivo', 'Tamaño Archivo (bytes)', 'Link Drive',
        'User Agent', 'Idioma', 'Zona Horaria', 'Resolución', 'Referrer', 'URL Origen',
        'Estado Email Admin', 'Estado Email Cliente', 'Link Reporte PDF'
      ]);
    }

    // 3. Subir a Drive (si hay archivo)
    let driveUrl = 'No disponible';
    if (data.fileBase64) {
      console.log("4. Intentando subir a Drive...");
      try {
        driveUrl = uploadToDrive(data.fileBase64, data.fileName, data.email, data.timestamp);
        response.actions.push('Drive Upload OK');
        console.log("4.1. Drive Upload OK:", driveUrl);
      } catch (error) {
        driveUrl = 'Error: ' + error.toString();
        response.actions.push('Drive Upload Fail');
        console.log("4.1. Drive Upload Error:", error.toString());
      }
    } else {
      console.log("4. No hay archivo para subir a Drive (Data Only)");
    }

    // 3.1 Subir Reporte Generado a Drive (si existe)
    let pdfReportUrl = 'No disponible';
    if (data.pdf_base64 || data.generatedPdfBase64) {
      const pdfContent = data.pdf_base64 || data.generatedPdfBase64;
      try {
        pdfReportUrl = uploadToDrive(pdfContent, `Estudio_Solar_${data.clientNumber || 'Cliente'}.pdf`, data.email, data.timestamp);
        console.log("4.2. Reporte PDF subido a Drive:", pdfReportUrl);
      } catch (e) {
        console.warn("Error subiendo reporte PDF:", e.toString());
      }
    }

    // 4. Enviar Email al ADMIN
    let emailAdminStatus = 'No enviado';
    if (data && (data.fileBase64 || data.email)) {
      console.log("5. Intentando enviar email Admin para: " + data.email);
      try {
        sendEmailToAdmin(data, driveUrl);
        emailAdminStatus = 'Enviado OK';
        response.actions.push('Email Admin OK');
      } catch (error) {
        emailAdminStatus = 'Error: ' + error.toString();
        response.actions.push('Email Admin Fail');
        console.log("5.1. Email Admin Error:", error.toString());
      }
    }

    // 5. Enviar Email al CLIENTE
    let emailClientStatus = 'No enviado';
    if (data && data.email) {
      console.log("6. Intentando enviar email Cliente a: " + data.email);
      try {
        sendEmailToClient(data, pdfReportUrl);
        emailClientStatus = 'Enviado OK';
        response.actions.push('Email Client OK');
      } catch (error) {
        emailClientStatus = 'Error: ' + error.toString();
        response.actions.push('Email Client Fail');
        console.log("6.1. Email Cliente Error:", error.toString());
      }
    }

    // 6. Guardar en Sheet
    console.log("7. Guardando fila en Sheet...");
    try {
      const rowData = [
        new Date(data.timestamp), data.email, data.name, data.phone, data.clientNumber,
        data.distributor, data.consumption, data.currentRate, data.currentCost,
        data.estimatedSystemCost, data.paybackPeriod, data.annualSavings,
        data.projectedCost, data.monthlyIncrease, data.monthlySavings,
        data.savings6m, data.savings5y,
        data.fileName, data.fileType, data.fileSize, driveUrl,
        data.userAgent, data.language, data.timezone,
        data.screenResolution, data.referrer, data.sourceUrl,
        emailAdminStatus, emailClientStatus, pdfReportUrl
      ];
      sheet.appendRow(rowData);
      console.log("8. Fila guardada correctamente.");
    } catch (rowError) {
      console.error("7.1 Error FATAL en sheet.appendRow:", rowError);
      throw rowError;
    }

    response.result = 'success';
    response.driveUrl = driveUrl;

    console.log("9. Finalizando doPost con éxito.");
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("ERROR GENERAL EN SCRIPT:", error.toString());
    response.error = error.toString();
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Función para subir a Drive
function uploadToDrive(base64Data, fileName, email, timestamp) {
  const mainFolderName = 'SolarOracle';
  let mainFolder;
  const folders = DriveApp.getFoldersByName(mainFolderName);

  if (folders.hasNext()) { mainFolder = folders.next(); }
  else { mainFolder = DriveApp.createFolder(mainFolderName); }

  const date = new Date(timestamp);
  const monthFolder = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');

  let targetFolder;
  const monthFolders = mainFolder.getFoldersByName(monthFolder);
  if (monthFolders.hasNext()) { targetFolder = monthFolders.next(); }
  else { targetFolder = mainFolder.createFolder(monthFolder); }

  const base64Content = base64Data.split(',')[1];
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), getMimeType(fileName), fileName);

  const timestamp_str = date.getTime();
  const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  const extension = fileName.split('.').pop();
  const uniqueFileName = `${sanitizedEmail}_${timestamp_str}.${extension}`;

  const file = targetFolder.createFile(blob);
  file.setName(uniqueFileName);
  file.setDescription(`Lead: ${email}`);

  return file.getUrl();
}

// Función Email al ADMIN
function sendEmailToAdmin(data, driveUrl) {
  const adminEmail = 'solaroracle.cl@gmail.com';

  // Array de adjuntos
  const attachments = [];

  // 1. Adjuntar Boleta Original (si existe)
  if (data.fileBase64) {
    const splitBase64 = data.fileBase64.split(',');
    const content = splitBase64.length > 1 ? splitBase64[1] : splitBase64[0];
    const blob = Utilities.newBlob(Utilities.base64Decode(content), getMimeType(data.fileName), 'Boleta_Cliente_' + data.fileName);
    attachments.push(blob);
  }

  // 2. Adjuntar PDF Generado (si existe)
  if (data.generatedPdfBase64) {
    // datauristring viene como "data:application/pdf;filename=generated.pdf;base64,....."
    const splitPdf = data.generatedPdfBase64.split(',');
    const contentPdf = splitPdf.length > 1 ? splitPdf[1] : splitPdf[0];
    const blobPdf = Utilities.newBlob(Utilities.base64Decode(contentPdf), 'application/pdf', `Analisis_SolarOracle_${data.clientNumber}.pdf`);
    attachments.push(blobPdf);
  }

  const subject = `🔥 Nuevo Lead: ${data.name || 'Sin nombre'} (${data.email})`;
  const body = `
    <h2>Nuevo Lead en SolarOracle</h2>
    <p><strong>Cliente:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Teléfono:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
    <p><strong>Link Boleta Drive:</strong> <a href="${driveUrl}">Ver Boleta en Drive</a></p>
    <hr>
    <h3>Resumen Análisis:</h3>
    <ul>
      <li>Consumo: ${data.consumption} kWh</li>
      <li>Ahorro 1 Año: ${data.savings1y}</li>
      <li>Inversión 5 Años: ${data.savings5y}</li>
    </ul>
    <p><em>Se adjuntan: Boleta original del cliente y Reporte PDF generado.</em></p>
  `;

  MailApp.sendEmail({
    to: adminEmail,
    subject: subject,
    htmlBody: body,
    attachments: attachments,
    name: 'SolarOracle Bot'
  });
}

// Función Email al CLIENTE (Estrategia de Conversión Premium 2026)
function sendEmailToClient(data, pdfReportUrl) {
  const userName = data.nombre || data.name || 'Futuro Cliente';
  const ubicacion = data.ubicacion || data.location || 'tu zona';
  const consumo = data.kwh_mensual || data.consumption || '-';
  const ahorroAnual = data.ahorro_anual || data.savings1y || '-';
  const costoInaccion = data.costo_inaccion || data.savings5y || '-';
  const payback = data.payback_period || '4-6'; // Estimación base si no viene

  // WhatsApp Link Personalizado
  const phoneAdmin = '56933519159'; // Tu número comercial
  const waText = encodeURIComponent(`Hola, soy ${userName}. Acabo de recibir mi análisis de SolarOracle para ${ubicacion} (${consumo} kWh) y me gustaría agendar la revisión técnica de 15 min.`);
  const waUrl = `https://wa.me/${phoneAdmin}?text=${waText}`;

  const subject = `☀️ Tu Análisis Solar en ${ubicacion}: ¿Cuánto puedes ahorrar realmente?`;

  const body = `
<div style="background-color: #f8fafc; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="600" border="0" cellspacing="0" cellpadding="0" align="center" style="background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
    <!-- Header Gradient: Autoridad y Confianza -->
    <tr>
      <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #064e3b 100%); padding: 60px 40px;">
        <div style="width: 75px; height: 75px; background-color: #ffffff; border-radius: 22px; line-height: 75px; font-size: 38px; font-weight: 900; color: #059669; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">S</div>
        <div style="color: #ffffff; font-size: 30px; font-weight: 900; letter-spacing: -1px; margin-bottom: 5px;">SolarOracle</div>
        <div style="color: #bbf7d0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Intelligence System • Chile</div>
      </td>
    </tr>

    <!-- Body Content: Conexión Humana -->
    <tr>
      <td style="padding: 50px 45px;">
        <h1 style="color: #1e293b; font-size: 26px; margin: 0 0 20px 0; font-weight: 900; letter-spacing: -0.5px;">Hola, ${userName} 👋</h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 30px;">
          Hemos analizado el potencial solar de tu propiedad en <strong>${ubicacion}</strong>. Más allá de los paneles, este estudio revela tu camino hacia la <strong>independencia energética</strong> y el control total sobre tus costos futuros.
        </p>

        <!-- Resumen de Valor (Psicología del Ahorro) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 35px;">
          <tr>
            <td width="48%" style="padding: 25px; background-color: #f0fdf4; border-radius: 24px; border: 1px solid #dcfce7; text-align: center;">
              <div style="color: #15803d; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px;">Ahorro Proyectado (Año 1)</div>
              <div style="color: #166534; font-size: 24px; font-weight: 900;">${ahorroAnual}</div>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding: 25px; background-color: #f8fafc; border-radius: 24px; border: 1px solid #f1f5f9; text-align: center;">
              <div style="color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px;">Recuperación (ROI)</div>
              <div style="color: #1e293b; font-size: 24px; font-weight: 900;">${payback} <span style="font-size: 14px; font-weight: 600;">Años</span></div>
            </td>
          </tr>
        </table>

        <!-- El Puente Profesional -->
        <div style="background-color: #fffbeb; border-left: 5px solid #f59e0b; padding: 20px; border-radius: 0 15px 15px 0; margin-bottom: 40px;">
           <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">
             "Este análisis se basa en tu consumo de <strong>${consumo} kWh</strong> y la radiación de tu zona. Es el punto de partida perfecto para una configuración final ajustada a tu techo real."
           </p>
        </div>

        <!-- CTA Principal: El Próximo Paso -->
        <div style="text-align: center; margin-bottom: 45px;">
          <a href="${waUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 22px 45px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); border: 2px solid rgba(255,255,255,0.2);">
            Agendar Revisión Técnica (15 min) 🗓️
          </a>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 15px; font-weight: 500;">Validamos tus números y despejamos dudas técnicas, sin compromiso.</p>
        </div>

        <!-- Mini FAQ: Reducción de Objeciones -->
        <div style="padding: 30px; background-color: #f8fafc; border-radius: 24px;">
           <h4 style="color: #1e293b; font-size: 15px; margin: 0 0 15px 0; font-weight: 900;">Dudas que podrías tener:</h4>
           <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 12px;">☀️ <strong>¿Funciona nublado?</strong> Sí, la tecnología actual capta radiación difusa incluso en días grises.</p>
           <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 12px;">🔌 <strong>¿Net Billing?</strong> En Chile, la ley te permite inyectar excedentes a la red y recibir crédito en tu cuenta.</p>
           <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">🛠️ <strong>¿Mantenimiento?</strong> Es mínimo. Solo limpieza ocasional para asegurar la máxima eficiencia.</p>
        </div>
      </td>
    </tr>

    <!-- Footer: Cercanía Humana -->
    <tr>
      <td align="center" style="background-color: #064e3b; padding: 50px 40px; color: #ffffff;">
        <div style="font-size: 18px; font-weight: 900; margin-bottom: 15px;">SolarOracle</div>
        <p style="color: #d1fae5; font-size: 13px; line-height: 1.6; margin: 0; opacity: 0.8;">
          No solo instalamos paneles, diseñamos tu libertad energética.<br>
          <a href="https://www.solaroracle.cl" style="color: #10b981; text-decoration: none; font-weight: 700;">www.solaroracle.cl</a><br><br>
          <span style="font-size: 11px; opacity: 0.5;">Este es un mensaje profesional generado por IA para SolarOracle.</span>
        </p>
      </td>
    </tr>
  </table>
</div>
  `;

  // Preparar adjunto del PDF (Valor real adjunto)
  const attachments = [];
  if (data.generatedPdfBase64 || data.pdf_base64) {
    const rawPdf = data.generatedPdfBase64 || data.pdf_base64;
    const splitPdf = rawPdf.split(',');
    const contentPdf = splitPdf.length > 1 ? splitPdf[1] : splitPdf[0];
    const blobPdf = Utilities.newBlob(Utilities.base64Decode(contentPdf), 'application/pdf', `Estudio_Solar_${userName.replace(/\s+/g, '_')}.pdf`);
    attachments.push(blobPdf);
  }

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: body,
    attachments: attachments,
    name: 'SolarOracle'
  });
}

function getMimeType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  const mimeTypes = { 'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png' };
  return mimeTypes[extension] || 'application/octet-stream';
}

function FORZAR_PERMISOS() {
  DriveApp.getRootFolder();
  MailApp.getRemainingDailyQuota();
  console.log("Permisos OK");
}
