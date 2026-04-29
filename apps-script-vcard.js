// One-shot vCard generator for the Claude Community UAE signup sheet.
// Exports all signups as a .vcf file in your Google Drive.
// Each contact is named "CCUAE <FirstName>" so you can find and bulk-delete them later if needed.
//
// Workflow:
//   1. Paste this in your Apps Script editor (alongside the existing doPost)
//   2. Save (Cmd+S)
//   3. Function dropdown → select generateVCard → ▶ Run
//   4. Open the Execution log → click the Drive URL it prints
//   5. Download the .vcf file
//   6. Double-click → macOS Contacts.app imports all 165
//   7. Wait ~5 min for iCloud → iPhone sync
//   8. WhatsApp → ⋮ → New broadcast → search "CCUAE" → select all → send invite link

function generateVCard() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('No signups in sheet — nothing to export.');
    return;
  }

  // Read rows 2..end, columns A-D (Timestamp | First Name | WhatsApp | Building)
  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

  var vcard = '';
  var exported = 0;
  var skipped = [];

  for (var i = 0; i < data.length; i++) {
    var firstName = String(data[i][1] || '').trim();
    var whatsapp = String(data[i][2] || '').trim();

    if (!firstName || !whatsapp) {
      skipped.push('Row ' + (i + 2) + ': missing name or whatsapp');
      continue;
    }
    if (whatsapp === '#ERROR!') {
      skipped.push('Row ' + (i + 2) + ': #ERROR! row');
      continue;
    }
    if (!whatsapp.match(/^\+\d{8,}$/)) {
      skipped.push('Row ' + (i + 2) + ': invalid phone format "' + whatsapp + '"');
      continue;
    }

    // Prefix with CCUAE so all contacts cluster together in your address book
    // and you can bulk-select them in WhatsApp Broadcast or delete them later
    var displayName = 'CCUAE ' + firstName;

    vcard += 'BEGIN:VCARD\r\n';
    vcard += 'VERSION:3.0\r\n';
    vcard += 'N:;' + displayName + ';;;\r\n';
    vcard += 'FN:' + displayName + '\r\n';
    vcard += 'TEL;TYPE=CELL:' + whatsapp + '\r\n';
    vcard += 'END:VCARD\r\n';

    exported++;
  }

  // Save to your Drive root
  var blob = Utilities.newBlob(vcard, 'text/x-vcard', 'claude-community-uae-contacts.vcf');
  var file = DriveApp.createFile(blob);

  Logger.log('---- vCard export complete ----');
  Logger.log('Exported: ' + exported + ' contacts');
  Logger.log('Skipped: ' + skipped.length);
  if (skipped.length) {
    skipped.forEach(function(s) { Logger.log('  ' + s); });
  }
  Logger.log('');
  Logger.log('📥 DOWNLOAD URL:');
  Logger.log(file.getUrl());
  Logger.log('');
  Logger.log('Next: open URL → Download → double-click .vcf → confirm import in Contacts.app');
}
