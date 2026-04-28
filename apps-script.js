// Google Apps Script — paste this in Extensions > Apps Script
// Then Deploy > Manage deployments > Edit > New version > Deploy
// (Increments the version while keeping the same /exec URL)
//
// Sheet schema: Timestamp | First Name | WhatsApp | Building With Claude

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  // Prefix WhatsApp with apostrophe so Sheets stores it as literal text.
  // Without this, "+971..." is parsed as a formula (#ERROR!) and "971..."
  // is coerced to a number (leading + stripped, scientific notation risk).
  sheet.appendRow([
    data.timestamp,
    data.firstName,
    "'" + data.whatsapp,
    data.building
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
