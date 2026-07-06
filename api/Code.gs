/**
 * C.Sole — Google Apps Script Backend for Visit Tracking
 *
 * === Setup (5 minutes, no credit card) ===
 * 1. Go to https://sheets.new — creates a blank Google Sheet
 * 2. Extensions → Apps Script
 * 3. Paste this entire file, save
 * 4. Click "Deploy" → "New deployment" → type: "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 5. Copy the URL (looks like https://script.google.com/macros/s/xxx/exec)
 * 6. Paste it into js/tracker.js and admin.html as API_BASE
 *
 * === Endpoints ===
 * GET  ?action=visits&pwd=YOUR_PASSWORD  → return all visits
 * POST ?action=visit                      → record a visit (body: JSON)
 */

var SHEET_NAME = 'Visits';
var ADMIN_PWD  = 'c';  // ← Change this to your admin password

function doGet(e) {
  var p = e.parameter;
  if (p.action === 'visits') {
    if (p.pwd !== ADMIN_PWD) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Incorrect password' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var sheet = getSheet();
    var data = sheet.getDataRange().getValues();
    var visits = [];
    for (var i = 1; i < data.length; i++) {
      visits.push({
        timestamp: data[i][0],
        isWeChat:  data[i][1] === 'TRUE',
        wxNick:    data[i][2] || '',
        wxAvatar:  data[i][3] || '',
        ua:        data[i][4] || '',
        referrer:  data[i][5] || '',
        country:   data[i][6] || '',
        city:      data[i][7] || '',
        vid:       data[i][8] || '',
      });
    }
    return ContentService.createTextOutput(JSON.stringify(visits))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('C.Sole Tracker API');
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet();
    sheet.appendRow([
      new Date().toISOString(),
      data.isWeChat ? 'TRUE' : 'FALSE',
      data.wxNick    || '',
      data.wxAvatar  || '',
      data.ua        || '',
      data.referrer  || '',
      data.country   || '',
      data.city      || '',
      data.vid       || '',
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'IsWeChat', 'WxNick', 'WxAvatar', 'UA', 'Referrer', 'Country', 'City', 'VisitorID']);
  }
  return sheet;
}
