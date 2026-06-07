// App logic for Market Challenge News Helper

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const btnSettings = document.getElementById('btn-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnCancelSettings = document.getElementById('btn-cancel-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const modalSettings = document.getElementById('modal-settings-overlay');

  const btnHistory = document.getElementById('btn-history');
  const btnCloseHistory = document.getElementById('btn-close-history');
  const modalHistory = document.getElementById('modal-history-overlay');
  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');

  const inputApiKey = document.getElementById('input-api-key');
  const inputSheetsUrl = document.getElementById('input-sheets-url');

  const dotApi = document.getElementById('dot-api');
  const dotSheets = document.getElementById('dot-sheets');

  const searchKeyword = document.getElementById('search-keyword');
  const btnSearch = document.getElementById('btn-search');
  const btnAddFavorite = document.getElementById('btn-add-favorite');
  const favoritesList = document.getElementById('favorites-list');

  const aiEmptyState = document.getElementById('ai-empty-state');
  const aiLoadingState = document.getElementById('ai-loading-state');
  const aiResultState = document.getElementById('ai-result-state');

  const newsSummaryText = document.getElementById('news-summary-text');
  const sentimentBadge = document.getElementById('sentiment-badge');
  const marketAnalysisText = document.getElementById('market-analysis-text');

  const commentaryInput = document.getElementById('commentary-input');
  const charCount = document.getElementById('char-count');
  const btnClearCommentary = document.getElementById('btn-clear-commentary');
  const commentaryDate = document.getElementById('commentary-date');
  const btnExport = document.getElementById('btn-export');
  const btnLoadYesterday = document.getElementById('btn-load-yesterday');

  const toast = document.getElementById('toast-notification');
  const toastIcon = document.getElementById('toast-icon');
  const toastMessage = document.getElementById('toast-message');

  const templateChips = document.querySelectorAll('.chip');

  // Application State
  let appState = {
    apiKey: localStorage.getItem('mcnh_api_key') || '',
    sheetsUrl: localStorage.getItem('mcnh_sheets_url') || '',
    newsTitle: '',
    newsSummary: '',
    aiAnalysis: '',
    sentiment: 'neutral',
    favorites: JSON.parse(localStorage.getItem('mcnh_favorites')) || ["전력인프라", "ESS", "반도체", "HD현대일렉트릭", "K방산", "연준 금리"],
    history: JSON.parse(localStorage.getItem('mcnh_history')) || []
  };

  // Initialize UI
  init();

  function init() {
    // Fill Settings Inputs
    inputApiKey.value = appState.apiKey;
    inputSheetsUrl.value = appState.sheetsUrl;

    // Update Status Indicators
    updateStatusIndicators();

    // Render Favorites
    renderFavorites();

    // Set Default Date to Today (Local)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    commentaryDate.value = `${yyyy}-${mm}-${dd}`;

    // Event Listeners
    btnSettings.addEventListener('click', openSettings);
    btnCloseSettings.addEventListener('click', closeSettings);
    btnCancelSettings.addEventListener('click', closeSettings);
    btnSaveSettings.addEventListener('click', saveSettings);

    // Close modal on overlay click
    modalSettings.addEventListener('click', (e) => {
      if (e.target === modalSettings) closeSettings();
    });

    // History Modal Listeners
    btnHistory.addEventListener('click', openHistory);
    btnCloseHistory.addEventListener('click', closeHistory);
    modalHistory.addEventListener('click', (e) => {
      if (e.target === modalHistory) closeHistory();
    });

    // Search Action
    btnSearch.addEventListener('click', performSearchAndAnalysis);
    searchKeyword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearchAndAnalysis();
    });

    // Favorites Action
    btnAddFavorite.addEventListener('click', addFavorite);

    // Commentary Inputs
    commentaryInput.addEventListener('input', updateCharCount);
    btnClearCommentary.addEventListener('click', clearCommentary);
    btnLoadYesterday.addEventListener('click', loadYesterdayCommentary);

    // Template Chips
    templateChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const templateText = chip.getAttribute('data-template');
        insertTemplate(templateText);
      });
    });

    // Export Action
    btnExport.addEventListener('click', exportToGoogleSheets);

    // Initial check for export button status
    updateExportButtonState();
  }

  // --- Status & Settings Helpers ---
  function updateStatusIndicators() {
    if (appState.apiKey) {
      dotApi.className = 'status-dot active';
    } else {
      dotApi.className = 'status-dot warning';
    }

    if (appState.sheetsUrl) {
      dotSheets.className = 'status-dot active';
    } else {
      dotSheets.className = 'status-dot';
    }
  }

  function openSettings() {
    modalSettings.classList.add('active');
  }

  function closeSettings() {
    modalSettings.classList.remove('active');
  }

  function saveSettings() {
    const key = inputApiKey.value.trim();
    const url = inputSheetsUrl.value.trim();

    localStorage.setItem('mcnh_api_key', key);
    localStorage.setItem('mcnh_sheets_url', url);

    appState.apiKey = key;
    appState.sheetsUrl = url;

    updateStatusIndicators();
    updateExportButtonState();
    closeSettings();
    showToast('설정이 안전하게 저장되었습니다.', 'success');
  }

  // --- History Helpers ---
  function openHistory() {
    modalHistory.classList.add('active');
    renderHistory();
  }

  function closeHistory() {
    modalHistory.classList.remove('active');
  }

  function renderHistory() {
    historyList.innerHTML = '';
    
    if (!appState.history || appState.history.length === 0) {
      historyEmpty.classList.remove('hidden');
      historyList.classList.add('hidden');
      return;
    }

    historyEmpty.classList.add('hidden');
    historyList.classList.remove('hidden');

    appState.history.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'history-item-card';
      card.innerHTML = `
        <div class="history-item-header">
          <span class="history-item-keyword">${escapeHtml(item.keyword || '키워드 없음')}</span>
          <div class="history-item-meta">
            <span class="history-item-sentiment-badge sentiment-${item.sentiment || 'neutral'}">${item.sentiment || 'neutral'}</span>
            <span class="history-item-date">${item.date || ''}</span>
          </div>
        </div>
        <div class="history-item-preview">${escapeHtml(item.commentary.substring(0, 50))}${item.commentary.length > 50 ? '...' : ''}</div>
      `;

      card.addEventListener('click', () => {
        commentaryInput.value = item.commentary;
        updateCharCount();
        updateExportButtonState();
        closeHistory();
        showToast('히스토리에서 코멘트를 불러왔습니다.', 'success');
      });

      historyList.appendChild(card);
    });
  }

  function saveToHistory(record) {
    if (appState.history.length > 0 && appState.history[0].commentary === record.commentary) {
      return;
    }
    
    appState.history.unshift(record);
    if (appState.history.length > 30) {
      appState.history.pop();
    }
    localStorage.setItem('mcnh_history', JSON.stringify(appState.history));
  }

  // --- Favorite Keywords Helpers ---
  function renderFavorites() {
    favoritesList.innerHTML = '';
    
    if (!appState.favorites || appState.favorites.length === 0) {
      favoritesList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">즐겨찾기가 없습니다.</span>';
      return;
    }

    appState.favorites.forEach(fav => {
      const chip = document.createElement('span');
      chip.className = 'favorite-chip';
      chip.textContent = fav + ' ';
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-del-fav';
      delBtn.innerHTML = '&times;';
      delBtn.title = '삭제';
      
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFavorite(fav);
      });

      chip.appendChild(delBtn);

      chip.addEventListener('click', () => {
        searchKeyword.value = fav;
        searchKeyword.focus();
      });

      favoritesList.appendChild(chip);
    });
  }

  function addFavorite() {
    const val = searchKeyword.value.trim();
    if (!val) {
      showToast('추가할 키워드를 입력해 주세요.', 'error');
      return;
    }

    if (appState.favorites.includes(val)) {
      showToast('이미 즐겨찾기에 등록된 키워드입니다.', 'warning');
      return;
    }

    appState.favorites.push(val);
    localStorage.setItem('mcnh_favorites', JSON.stringify(appState.favorites));
    renderFavorites();
    showToast(`"${val}" 키워드가 즐겨찾기에 추가되었습니다.`, 'success');
  }

  function deleteFavorite(fav) {
    appState.favorites = appState.favorites.filter(x => x !== fav);
    localStorage.setItem('mcnh_favorites', JSON.stringify(appState.favorites));
    renderFavorites();
    showToast(`"${fav}" 키워드가 삭제되었습니다.`, 'success');
  }

  // --- Yesterday Commentary Loader ---
  function loadYesterdayCommentary() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yyyy}-${mm}-${dd}`;

    const record = appState.history.find(item => item.date === yesterdayStr);

    if (record) {
      commentaryInput.value = record.commentary;
      updateCharCount();
      updateExportButtonState();
      
      // Update date to today's date
      const tYyyy = today.getFullYear();
      const tMm = String(today.getMonth() + 1).padStart(2, '0');
      const tDd = String(today.getDate()).padStart(2, '0');
      commentaryDate.value = `${tYyyy}-${tMm}-${tDd}`;

      showToast('어제 코멘트를 불러오고 날짜를 오늘로 설정했습니다.', 'success');
    } else {
      showToast('어제 작성된 코멘트가 없습니다.', 'warning');
    }
  }

  // Helper to escape HTML tags
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- UI Toast & Helpers ---
  function showToast(message, type = 'success') {
    toastMessage.textContent = message;

    if (type === 'success') {
      toastIcon.innerHTML = `
        <svg class="toast-success-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else if (type === 'warning') {
      toastIcon.innerHTML = `
        <svg class="toast-warning-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `;
    } else {
      toastIcon.innerHTML = `
        <svg class="toast-error-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    }

    toast.className = `toast active`;

    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout);
    }

    window.toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 4000);
  }

  function updateCharCount() {
    const text = commentaryInput.value;
    charCount.textContent = `${text.length} 자 입력됨`;
    updateExportButtonState();
  }

  function clearCommentary() {
    if (confirm('작성 중인 코멘트를 모두 지우시겠습니까?')) {
      commentaryInput.value = '';
      updateCharCount();
    }
  }

  function insertTemplate(template) {
    const startPos = commentaryInput.selectionStart;
    const endPos = commentaryInput.selectionEnd;
    const text = commentaryInput.value;

    commentaryInput.value = text.substring(0, startPos) + template + text.substring(endPos);
    commentaryInput.focus();

    // Position cursor at the end of inserted template
    const newCursorPos = startPos + template.length;
    commentaryInput.setSelectionRange(newCursorPos, newCursorPos);

    updateCharCount();
  }

  function updateExportButtonState() {
    // Enabled only if Sheets URL is configured AND there is some news data or user commentary
    const hasSheets = !!appState.sheetsUrl;
    const hasContent = commentaryInput.value.trim().length > 0 || !!appState.newsSummary;

    btnExport.disabled = !(hasSheets && hasContent);
  }

  // --- Search & Gemini API ---
  async function performSearchAndAnalysis() {
    const keyword = searchKeyword.value.trim();

    if (!keyword) {
      showToast('검색 키워드를 입력해 주세요.', 'error');
      searchKeyword.focus();
      return;
    }

    if (!appState.apiKey) {
      showToast('Gemini API 키가 설정되지 않았습니다. 우측 상단 설정을 열어주세요.', 'error');
      openSettings();
      return;
    }

    // Toggle States to Loading
    aiEmptyState.classList.add('hidden');
    aiResultState.classList.add('hidden');
    aiLoadingState.classList.remove('hidden');
    btnSearch.disabled = true;

    const prompt = `당신은 경제/금융 전문 애널리스트이자 실황 리포트 작성 도우미입니다. 
다음 검색 키워드에 대해 최신 뉴스를 실시간 구글 검색으로 탐색하고 분석한 리포트를 작성하세요.
키워드: "${keyword}"

최신 상황을 탐색한 후, 반드시 아래의 JSON 스키마를 만족하는 결과물만을 출력해야 합니다.
답변에는 마크다운 기호(\`\`\`)나 다른 설명용 텍스트를 절대 넣지 말고, 오직 파싱 가능한 순수 JSON 오브젝트만 반환하세요:

{
  "news_title": "가장 중요도가 높고 핵심을 찌르는 뉴스 헤드라인 제목 1개",
  "summary": "최근 뉴스 및 시장 움직임의 주요 팩트와 세부 수치를 요약한 핵심 리스트 (3~4줄로 정리하되, 각 줄의 시작은 '-' 글머리 기호로 작성)",
  "sentiment": "bullish" | "bearish" | "neutral" 중 하나 (뉴스가 시장 전반 혹은 관련 섹터에 미치는 영향의 성격),
  "analysis": "해당 뉴스가 시황에 미칠 영향성, 주목해야 할 전망 및 투자자 대응 방안 (3~4줄로 정리하되, 각 줄의 시작은 '-' 글머리 기호로 작성)"
}`;

    let response;
    let retries = 3;
    let delay = 2000; // start with 2 seconds

    try {
      for (let i = 0; i < retries; i++) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': appState.apiKey
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ],
            tools: [
              {
                google_search: {}
              }
            ]
          })
        });

        // 429 Error Retry logic
        if (response.status === 429 && i < retries - 1) {
          showToast(`API 요청량 초과(429) 감지: ${delay / 1000}초 후 자동 재시도합니다... (${i + 1}/${retries})`, 'warning');
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
          continue;
        }
        break;
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`API 요청 한도 초과 (429). Google Search Grounding 도구 또는 Gemini API 사용량이 한도에 달했습니다. 1~2분 후에 다시 시도해 주세요.`);
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const resData = await response.json();

      // Parse response text - handle markdown code fences if present
      let resultText = resData.candidates[0].content.parts[0].text.trim();
      // Strip markdown code fences (```json ... ```) if the model wraps the output
      const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        resultText = jsonMatch[1].trim();
      }
      // Also try to extract a raw JSON object if no fences
      const rawMatch = resultText.match(/\{[\s\S]*\}/);
      if (rawMatch) {
        resultText = rawMatch[0];
      }
      const parsedData = JSON.parse(resultText);

      // Update State
      appState.newsTitle = parsedData.news_title || '';
      appState.newsSummary = parsedData.summary || '';
      appState.aiAnalysis = parsedData.analysis || '';
      appState.sentiment = parsedData.sentiment || 'neutral';

      // Update UI
      newsSummaryText.innerHTML = `<strong>[헤드라인] ${appState.newsTitle}</strong><br><br>${formatBulletPoints(appState.newsSummary)}`;
      marketAnalysisText.innerHTML = formatBulletPoints(appState.aiAnalysis);

      // Update Sentiment Badge
      sentimentBadge.textContent = appState.sentiment;
      sentimentBadge.className = `sentiment-display sentiment-${appState.sentiment}`;

      // Show Result
      aiLoadingState.classList.add('hidden');
      aiResultState.classList.remove('hidden');
      showToast('성공적으로 실시간 분석이 완료되었습니다.', 'success');

    } catch (error) {
      console.error(error);
      aiLoadingState.classList.add('hidden');
      aiEmptyState.classList.remove('hidden');
      showToast(`분석 실패: ${error.message}`, 'error');
    } finally {
      btnSearch.disabled = false;
      updateExportButtonState();
    }
  }

  // Helper to format raw AI output text with line breaks for bullet points
  function formatBulletPoints(text) {
    if (!text) return '';
    return text.split('\n').join('<br>');
  }

  // --- Export to Google Sheets ---
  async function exportToGoogleSheets() {
    if (!appState.sheetsUrl) {
      showToast('구글 시트 URL이 설정되지 않았습니다. 설정을 확인해 주세요.', 'error');
      openSettings();
      return;
    }

    btnExport.disabled = true;
    const originalBtnText = btnExport.querySelector('span').textContent;
    btnExport.querySelector('span').textContent = '전송 중...';

    const payload = {
      date: commentaryDate.value,
      keyword: searchKeyword.value.trim(),
      summary: appState.newsSummary ? `[${appState.newsTitle}]\n${appState.newsSummary}` : '뉴스 요약 없음',
      analysis: appState.aiAnalysis || 'AI 분석 없음 (시황 요약만 수동 기록)',
      commentary: commentaryInput.value.trim()
    };

    try {
      // Send to Apps Script Web App
      // Apps Script Web App redirects are standard, so 'no-cors' mode guarantees no browser CORS blockers block the execution,
      // but since we want to know if it sent correctly, we do a fallback/success guess if it doesn't fail on connection.
      await fetch(appState.sheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Since 'no-cors' does not let us read the status, if the fetch promise resolves (which it does unless there's a network drop),
      // we can comfortably display a success message.
      showToast('구글 시트로 전송이 성공적으로 완료되었습니다!', 'success');

      // Save to local history
      saveToHistory({
        date: commentaryDate.value,
        keyword: searchKeyword.value.trim(),
        summary: appState.newsSummary ? `[${appState.newsTitle}]\n${appState.newsSummary}` : '',
        analysis: appState.aiAnalysis || '',
        sentiment: appState.sentiment || 'neutral',
        commentary: commentaryInput.value.trim()
      });

    } catch (error) {
      console.error(error);
      showToast(`구글 시트 전송 실패: ${error.message}`, 'error');
    } finally {
      btnExport.disabled = false;
      btnExport.querySelector('span').textContent = originalBtnText;
    }
  }
});
