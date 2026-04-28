// One-shot cleanup for the WhatsApp column in the signup sheet.
// Paste this ALONGSIDE the existing doPost in the Apps Script editor,
// then click into cleanupExistingRows and press Run. Run once, delete after.
//
// Behavior:
//  - Forces column C (WhatsApp) to plain-text format
//  - For each row that's a digits-only number (10+ digits): prepends "+"
//  - Skips rows already starting with "+"
//  - Skips #ERROR! rows (data unrecoverable)
//  - Logs anything too short / unrecognized for manual review

function cleanupExistingRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('Nothing to clean — sheet is empty.');
    return;
  }

  var range = sheet.getRange(2, 3, lastRow - 1, 1); // column C, rows 2..end
  range.setNumberFormat('@'); // plain text — protects future writes too

  var values = range.getValues();
  var modified = 0;
  var alreadyOk = 0;
  var flagged = [];

  for (var i = 0; i < values.length; i++) {
    var rowNum = i + 2;
    var v = String(values[i][0]).trim();
    if (!v) continue;

    if (v === '#ERROR!') {
      flagged.push('Row ' + rowNum + ': #ERROR! — data lost (likely Saksham), needs to be re-collected via DM');
      continue;
    }
    if (v.charAt(0) === '+') {
      alreadyOk++;
      continue;
    }
    if (/^\d{10,}$/.test(v)) {
      values[i][0] = '+' + v;
      modified++;
    } else {
      flagged.push('Row ' + rowNum + ': "' + v + '" — too short or unrecognized format, manual fix needed');
    }
  }

  range.setValues(values);

  Logger.log('---- WhatsApp column cleanup complete ----');
  Logger.log('Already correct: ' + alreadyOk);
  Logger.log('Modified (prepended +): ' + modified);
  Logger.log('Flagged for manual review: ' + flagged.length);
  flagged.forEach(function(f) { Logger.log('  ' + f); });
}
