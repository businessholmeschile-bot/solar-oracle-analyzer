// Google Apps Script ACTUALIZADO para SolarOracle
// Este código reemplaza el anterior en: Extensions > Apps Script

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);

    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // If this is the first row, add headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Email',
        'Nombre',
        'Teléfono',
        'N° Cliente',
        'Consumo (kWh)',
        'Tarifa Actual ($/kWh)',
        'Costo Actual ($)',
        'Costo Proyectado ($)',
        'Aumento Mensual ($)',
        'Ahorro Mensual ($)',
        'Ahorro 6 meses ($)',
        'Ahorro 1 año ($)',
        'Ahorro 2 años ($)',
        'Ahorro 3 años ($)',
        'Ahorro 5 años ($)',
        'Nombre Archivo',
        'Tipo Archivo',
        'Tamaño Archivo (bytes)',
        'Link Drive',
        'User Agent',
        'Idioma',
        'Zona Horaria',
        'Resolución',
        'Referrer',
        'URL Origen'
      ]);
    }

    // Upload file to Drive if provided
    let driveUrl = 'No disponible';
    if (data.fileBase64) {
      try {
        driveUrl = uploadToDrive(
          data.fileBase64,
          data.fileName,
          data.email,
          data.timestamp
        );
      } catch (error) {
        Logger.log('Error uploading to Drive: ' + error);
        driveUrl = 'Error al subir';
      }
    }

    // Add the new lead with all data
    sheet.appendRow([
      new Date(data.timestamp),
      data.email,
      data.name,
      data.phone,
      data.clientNumber,
      data.consumption,
      data.currentRate,
      data.currentCost,
      data.projectedCost,
      data.monthlyIncrease,
      data.monthlySavings,
      data.savings6m,
      data.savings1y,
      data.savings2y,
      data.savings3y,
      data.savings5y,
      data.fileName,
      data.fileType,
      data.fileSize,
      driveUrl,
      data.userAgent,
      data.language,
      data.timezone,
      data.screenResolution,
      data.referrer,
      data.sourceUrl
    ]);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        'result': 'success',
        'driveUrl': driveUrl
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error in doPost: ' + error);
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        'result': 'error',
        'error': error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadToDrive(base64Data, fileName, email, timestamp) {
  try {
    // Get or create main folder
    const mainFolderName = 'SolarOracle - Boletas';
    let mainFolder;
    const folders = DriveApp.getFoldersByName(mainFolderName);

    if (folders.hasNext()) {
      mainFolder = folders.next();
    } else {
      mainFolder = DriveApp.createFolder(mainFolderName);
    }

    // Create month folder (YYYY-MM)
    const date = new Date(timestamp);
    const monthFolder = date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0');

    let targetFolder;
    const monthFolders = mainFolder.getFoldersByName(monthFolder);

    if (monthFolders.hasNext()) {
      targetFolder = monthFolders.next();
    } else {
      targetFolder = mainFolder.createFolder(monthFolder);
    }

    // Remove data URL prefix (e.g., "data:application/pdf;base64,")
    const base64Content = base64Data.split(',')[1];

    // Decode Base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Content),
      getMimeType(fileName),
      fileName
    );

    // Create unique filename
    const timestamp_str = date.getTime();
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const extension = fileName.split('.').pop();
    const uniqueFileName = `${sanitizedEmail}_${timestamp_str}.${extension}`;

    // Upload file
    const file = targetFolder.createFile(blob);
    file.setName(uniqueFileName);
    file.setDescription(`Boleta de ${email} - ${date.toLocaleString('es-CL')}`);

    // Make file accessible (optional - remove if you want private files)
    // file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Return file URL
    return file.getUrl();

  } catch (error) {
    Logger.log('Error in uploadToDrive: ' + error);
    throw error;
  }
}

function getMimeType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

// Test function (optional)
function testDoPost() {
  const testData = {
    email: 'test@example.com',
    name: 'Test User',
    phone: '+56912345678',
    timestamp: new Date().toISOString(),
    clientNumber: '85602828',
    consumption: 342,
    currentRate: 152,
    currentCost: 52000,
    projectedCost: 83720,
    monthlyIncrease: 31720,
    monthlySavings: 71122,
    savings6m: 426732,
    savings1y: 853464,
    savings2y: 1706928,
    savings3y: 2560392,
    savings5y: 4267320,
    fileName: 'test.pdf',
    fileType: 'application/pdf',
    fileSize: 12345,
    fileBase64: null,
    userAgent: 'Test Agent',
    language: 'es-CL',
    timezone: 'America/Santiago',
    screenResolution: '1920x1080',
    referrer: 'Direct',
    sourceUrl: 'https://holmestest.xyz'
  };

  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  Logger.log(doPost(e).getContent());
}
