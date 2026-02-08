// Google Apps Script para recibir leads de SolarOracle
// Este código va en: Extensions > Apps Script en tu Google Sheet

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
        'N° Cliente',
        'Consumo (kWh)',
        'Ahorro Anual'
      ]);
    }
    
    // Add the new lead
    sheet.appendRow([
      new Date(data.timestamp),
      data.email,
      data.name,
      data.clientNumber,
      data.consumption,
      data.savings1y
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function (optional)
function testDoPost() {
  const testData = {
    email: 'test@example.com',
    name: 'Test User',
    timestamp: new Date().toISOString(),
    clientNumber: '85602828',
    consumption: 342,
    savings1y: 526000
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  Logger.log(doPost(e).getContent());
}
