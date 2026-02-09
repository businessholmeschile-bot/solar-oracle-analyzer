// Google Apps Script ACTUALIZADO - SolarOracle Ultimate
// Funcionalidades:
// 1. Guarda datos en Google Sheet (26 campos)
// 2. Sube boleta a Google Drive (Carpeta 'SolarOracle')
// 3. Envía alerta al ADMIN (solaroracle.cl@gmail.com)
// 4. Envía estudio al CLIENTE (data.email)

function doPost(e) {
  const response = { result: 'error', actions: [] };

  try {
    // 1. Parsear datos
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 2. Encabezados (si es hoja nueva)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Email', 'Nombre', 'Teléfono', 'N° Cliente',
        'Consumo (kWh)', 'Tarifa Actual ($/kWh)', 'Costo Actual ($)', 'Costo Proyectado ($)',
        'Aumento Mensual ($)', 'Ahorro Mensual ($)', 'Ahorro 6 meses ($)',
        'Ahorro 1 año ($)', 'Ahorro 2 años ($)', 'Ahorro 3 años ($)', 'Ahorro 5 años ($)',
        'Nombre Archivo', 'Tipo Archivo', 'Tamaño Archivo (bytes)', 'Link Drive',
        'User Agent', 'Idioma', 'Zona Horaria', 'Resolución', 'Referrer', 'URL Origen',
        'Estado Email Admin', 'Estado Email Cliente'
      ]);
    }

    // 3. Subir a Drive (si hay archivo)
    let driveUrl = 'No disponible';
    if (data.fileBase64) {
      try {
        driveUrl = uploadToDrive(data.fileBase64, data.fileName, data.email, data.timestamp);
        response.actions.push('Drive Upload OK');
      } catch (error) {
        driveUrl = 'Error: ' + error.toString();
        response.actions.push('Drive Upload Fail');
      }
    }

    // 4. Enviar Email al ADMIN
    let emailAdminStatus = 'No enviado';
    if (data.fileBase64) {
      try {
        sendEmailToAdmin(data, driveUrl);
        emailAdminStatus = 'Enviado OK';
        response.actions.push('Email Admin OK');
      } catch (error) {
        emailAdminStatus = 'Error: ' + error.toString();
        response.actions.push('Email Admin Fail');
      }
    }

    // 5. Enviar Email al CLIENTE
    let emailClientStatus = 'No enviado';
    if (data.fileBase64 && data.email) {
      try {
        sendEmailToClient(data);
        emailClientStatus = 'Enviado OK';
        response.actions.push('Email Client OK');
      } catch (error) {
        emailClientStatus = 'Error: ' + error.toString();
        response.actions.push('Email Client Fail');
      }
    }

    // 6. Guardar en Sheet
    sheet.appendRow([
      new Date(data.timestamp), data.email, data.name, data.phone, data.clientNumber,
      data.consumption, data.currentRate, data.currentCost, data.projectedCost,
      data.monthlyIncrease, data.monthlySavings, data.savings6m, data.savings1y,
      data.savings2y, data.savings3y, data.savings5y, data.fileName, data.fileType,
      data.fileSize, driveUrl, data.userAgent, data.language, data.timezone,
      data.screenResolution, data.referrer, data.sourceUrl,
      emailAdminStatus, emailClientStatus
    ]);

    response.result = 'success';
    response.driveUrl = driveUrl;

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
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
  const base64Content = data.fileBase64.split(',')[1];
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Content), getMimeType(data.fileName), data.fileName);

  const subject = `🔥 Nuevo Lead: ${data.name || 'Sin nombre'} (${data.email})`;
  const body = `
    <h2>Nuevo Lead en SolarOracle</h2>
    <p><strong>Cliente:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Teléfono:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
    <p><strong>Link Boleta Drive:</strong> <a href="${driveUrl}">Ver Boleta</a></p>
    <hr>
    <h3>Resumen Análisis:</h3>
    <ul>
      <li>Consumo: ${data.consumption} kWh</li>
      <li>Ahorro 1 Año: ${data.savings1y}</li>
      <li>Inversión 5 Años: ${data.savings5y}</li>
    </ul>
  `;

  MailApp.sendEmail({
    to: adminEmail,
    subject: subject,
    htmlBody: body,
    attachments: [blob],
    name: 'SolarOracle Bot'
  });
}

// Función Email al CLIENTE
function sendEmailToClient(data) {
  // Configuración del correo al cliente
  const subject = `☀️ Tu Estudio de Ahorro Solar - SolarOracle`;
  const body = `
    <div style="font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #ff6b00; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">SOLAR ORACLE</h1>
        <p style="color: white; margin: 5px 0 0; opacity: 0.9;">Tu futuro energético, hoy</p>
      </div>
      
      <div style="padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hola <strong>${data.name || 'Futuro Cliente'}</strong>,</p>
        
        <p>Gracias por usar nuestro analizador inteligente. Hemos procesado tu boleta eléctrica y los resultados son prometedores.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">PROYECCIÓN DE AHORRO ANUAL</p>
          <h2 style="margin: 10px 0 0; color: #27ae60; font-size: 36px;">${data.savings1y}</h2>
          <p style="margin: 5px 0 0; color: #888; font-size: 12px;">*Con sistema solar cubriendo 85% del consumo</p>
        </div>
        
        <h3>📊 Detalles de tu Análisis:</h3>
        <ul style="line-height: 1.6;">
          <li><strong>Consumo Actual:</strong> ${data.consumption} kWh/mes</li>
          <li><strong>Costo Actual:</strong> ${data.currentCost}</li>
          <li><strong>Ahorro a 5 Años:</strong> ${data.savings5y}</li>
        </ul>
        
        <p>Este es el momento perfecto para independizarte de las alzas tarifarias.</p>
        
        <div style="text-align: center; margin-top: 35px;">
          <a href="https://wa.me/56912345678?text=Hola,%20recibí%20mi%20estudio%20y%20quiero%20cotizar" 
             style="background-color: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
             📲 Hablar con un Experto
          </a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>SolarOracle.cl - Energía Inteligente</p>
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: body,
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
