/**
 * Google Apps Script for Market Challenge News Helper
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any code in the editor and paste this code.
 * 4. Click Save (floppy disk icon).
 * 5. Click Deploy > New deployment.
 * 6. Select type: "Web app".
 * 7. Change "Who has access" to "Anyone" (This is required for the web app to receive requests from your browser).
 * 8. Click Deploy. Authorize permissions if prompted.
 * 9. Copy the Web app URL and paste it into the Settings of the Market Challenge News Helper.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10 seconds for a lock
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Initialize headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["날짜", "검색 키워드", "뉴스 요약 & 핵심 내용", "AI 시장 분석", "사용자 시황 코멘트"]);
      
      // Basic formatting for headers
      var headerRange = sheet.getRange(1, 1, 1, 5);
      headerRange.setBackground("#1e293b"); // slate-800
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setRowHeight(1, 35);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    var dateVal = data.date || new Date().toLocaleDateString('ko-KR');
    var keywordVal = data.keyword || "";
    var summaryVal = data.summary || "";
    var analysisVal = data.analysis || "";
    var commentaryVal = data.commentary || "";
    
    sheet.appendRow([
      dateVal,
      keywordVal,
      summaryVal,
      analysisVal,
      commentaryVal
    ]);
    
    // Auto-fit column widths
    for (var col = 1; col <= 5; col++) {
      sheet.autoResizeColumn(col);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "Data successfully appended to Google Sheet." 
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
    
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput("<h3>Google Sheets Web App for News Helper is active.</h3><p>Use POST method to submit data.</p>");
}
