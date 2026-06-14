/**
 * Google Apps Script for Market Challenge News Helper (Proxy Version)
 * 
 * ✅ 스크립트 속성(Script Properties) 설정 필수:
 *   1. 구글 시트 -> 확장 프로그램 > Apps Script 실행
 *   2. 이 코드 전체 붙여넣기 (기존 코드 대체)
 *   3. 좌측 메뉴 [프로젝트 설정] (톱니바퀴 아이콘) 클릭
 *   4. [스크립트 속성 편집] 클릭 후 속성 추가:
 *      - 속성 이름: GEMINI_API_KEY
 *      - 속성 값: 사용자님의 AQ. (또는 AIza) API Key 입력
 *   5. 우측 상단 [배포] > [새 배포] 클릭
 *      - 유형: 웹 앱
 *      - 다음 사용자 권한으로 실행: 나 (Me)
 *      - 액세스할 수 있는 사용자: 모든 사용자 (Anyone)
 *   6. 배포 완료 후 생성된 웹 앱 URL을 복사하여 우리 앱 설정의 "Google Sheets Web App URL"에 입력하세요.
 */

var GEMINI_MODEL = 'gemini-2.5-flash';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    var action = data.action || 'exportData';

    if (action === 'analyzeKeyword') {
      return analyzeKeywordWithGemini(data.keyword);
    }

    if (action === 'exportData') {
      return exportDataToSheet(data);
    }

    return jsonResponse({
      status: 'error',
      message: '알 수 없는 요청(Unknown action): ' + action
    });

  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

function analyzeKeywordWithGemini(keyword) {
  if (!keyword) {
    return jsonResponse({
      status: 'error',
      message: '키워드가 없습니다.'
    });
  }

  // Apps Script 환경의 스크립트 속성에서 API 키 로드
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    return jsonResponse({
      status: 'error',
      message: 'GEMINI_API_KEY가 등록되지 않았습니다. 코드를 확인하거나 Apps Script 설정을 확인하세요.'
    });
  }

  var url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    GEMINI_MODEL +
    ':generateContent';

  var prompt =
    '당신은 경제/금융 전문 애널리스트이자 실황 리포트 작성 도우미입니다.\n' +
    '다음 검색 키워드에 대해 최신 뉴스를 실시간 구글 검색으로 탐색하고 분석한 리포트를 작성하세요.\n' +
    '키워드: "' + keyword + '"\n\n' +
    '최신 상황을 탐색한 후, 반드시 아래의 JSON 스키마를 만족하는 결과물만을 출력해야 합니다.\n' +
    '답변에는 마크다운 기호(```)나 다른 설명용 텍스트를 절대 넣지 말고, 오직 파싱 가능한 순수 JSON 오브젝트만 반환하세요:\n\n' +
    '{\n' +
    '  "news_title": "가장 중요도가 높고 핵심을 찌르는 뉴스 헤드라인 제목 1개",\n' +
    '  "summary": "최근 뉴스 및 시장 움직임의 주요 팩트와 세부 수치를 요약한 핵심 리스트 (3~4줄, 각 줄 시작은 - 글머리)",\n' +
    '  "sentiment": "bullish 또는 bearish 또는 neutral 중 하나",\n' +
    '  "analysis": "해당 뉴스가 시황에 미칠 영향성, 주목해야 할 전망 및 투자자 대응 방안 (3~4줄, 각 줄 시작은 - 글머리)"\n' +
    '}';

  var payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    tools: [
      {
        google_search: {}
      }
    ]
  };

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-goog-api-key': apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    var body = response.getContentText();

    if (code < 200 || code >= 300) {
      var trimmedBody = body.substring(0, 800) + (body.length > 800 ? '...[생략됨]' : '');
      return jsonResponse({
        status: 'error',
        message: 'Gemini API 에러 (상태코드: ' + code + ')',
        details: trimmedBody
      });
    }

    var geminiData = JSON.parse(body);
    var resultText = '';

    if (
      geminiData.candidates &&
      geminiData.candidates[0] &&
      geminiData.candidates[0].content &&
      geminiData.candidates[0].content.parts &&
      geminiData.candidates[0].content.parts[0]
    ) {
      resultText = geminiData.candidates[0].content.parts[0].text || '';
    }

    if (!resultText) {
      return jsonResponse({
        status: 'error',
        message: 'Gemini 응답에서 텍스트 결과(candidates)를 찾을 수 없습니다.',
        raw: geminiData
      });
    }

    return jsonResponse({
      status: 'success',
      result: resultText
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

function exportDataToSheet(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '날짜',
      '검색 키워드',
      '뉴스 요약 & 핵심 내용',
      'AI 시장 분석',
      '사용자 시황 코멘트'
    ]);

    var headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setBackground('#1e293b');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setRowHeight(1, 35);
  }

  sheet.appendRow([
    data.date || new Date().toLocaleDateString('ko-KR'),
    data.keyword || '',
    data.summary || '',
    data.analysis || '',
    data.commentary || ''
  ]);

  for (var col = 1; col <= 5; col++) {
    sheet.autoResizeColumn(col);
  }

  return jsonResponse({
    status: 'success',
    message: '성공적으로 구글 시트에 기록되었습니다.'
  });
}

function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<h3>Market Challenge News Helper Apps Script is active.</h3>' +
    '<p>POST action: analyzeKeyword 또는 exportData</p>'
  );
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 에디터에서 직접 실행해 볼 수 있는 테스트 함수 ────────────────
function testAnalyzeKeyword() {
  var res = analyzeKeywordWithGemini('전력인프라');
  Logger.log(res.getContentText());
}
