// Google Apps Script — paste this in Extensions > Apps Script
// Then Deploy > New deployment > Web app > Anyone > Deploy
// Copy the URL and replace YOUR_GOOGLE_APPS_SCRIPT_URL in index.html

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.timestamp,
    data.firstName,
    data.whatsapp
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
