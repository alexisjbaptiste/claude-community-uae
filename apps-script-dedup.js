// One-shot dedup for the signup sheet.
// Paste alongside the existing doPost in the Apps Script editor, run once.
//
// Behavior:
//  - Treats column C (WhatsApp) as the unique key
//  - Keeps the FIRST occurrence (lowest row number) of each WhatsApp value
//  - Deletes every subsequent row with the same WhatsApp value
//  - Skips empty cells and #ERROR! cells (no false matches)
//  - Logs how many rows were deleted

function removeDuplicates() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 3) {
    Logger.log('Nothing to dedup — fewer than 2 data rows.');
    return;
  }

  var range = sheet.getRange(2, 3, lastRow - 1, 1); // column C, rows 2..end
  var values = range.getValues();

  var seen = {};
  var toDelete = []; // 1-indexed row numbers

  for (var i = 0; i < values.length; i++) {
    var v = String(values[i][0]).trim();
    if (!v || v === '#ERROR!') continue;
    if (seen[v]) {
      toDelete.push(i + 2); // i=0 → row 2 (header is row 1)
    } else {
      seen[v] = true;
    }
  }

  // Delete in REVERSE order so earlier row numbers don't shift
  toDelete.sort(function(a, b) { return b - a; });
  toDelete.forEach(function(rowNum) {
    sheet.deleteRow(rowNum);
  });

  Logger.log('---- Dedup complete ----');
  Logger.log('Unique WhatsApp numbers kept: ' + Object.keys(seen).length);
  Logger.log('Duplicate rows removed: ' + toDelete.length);
}
