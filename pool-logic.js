// ════════════════════════════════════════════════════════════
//  pool-logic.js — 卡池規則、下拉選單、自動填入
// ════════════════════════════════════════════════════════════

// ── O(1) 卡名 → 角色 對照表 ───────────────────────────────
//    在靜態資料載入後一次性建立，取代原本 O(n) 的迭代搜尋。
//    此函式在腳本解析時立即執行一次，無需等待 DOMContentLoaded。
//    【新增】原本是 const + IIFE，改為 let + 具名函式，
//    是為了讓使用者透過「卡池資料管理」新增/刪除自訂卡池後，
//    custom-pools.js 能呼叫 window.rebuildCardToLeadMap() 重建對照表，
//    不必重新整理頁面就能讓 OCR 辨識、反查卡池等功能立即生效。
function buildCardToLeadMap() {
    const map = new Map();
    if (typeof standardCards !== 'undefined') {
        for (const [lead, cards] of Object.entries(standardCards))
            cards.forEach(c => map.set(c, lead));
    }
    if (typeof eventCards !== 'undefined') {
        eventCards.forEach(e => {
            for (const [lead, cards] of Object.entries(e.cards))
                cards.forEach(c => map.set(c, lead));
        });
    }
    return map;
}

let cardToLeadMap = buildCardToLeadMap();

// 提供給 custom-pools.js：使用者新增/刪除自訂卡池資料後呼叫，重建對照表
window.rebuildCardToLeadMap = function () {
    cardToLeadMap = buildCardToLeadMap();
};

function findTrueLead(cardName) {
    if (!cardName || cardName === '未知') {
        return null;
    }

    return cardToLeadMap.get(cardName) ?? null;
}

// ── 共用 Helper：依 poolType 設定 subPool 選項 ─────────────
//    原本重複 3 次的邏輯，統一由此函式處理。
//    判斷順序：混池 > 日卡 > 單人（順序不可任意對調）
function setSubPoolFromEvent(event) {
    const sub = event.poolType.includes('混池') ? '混池'
              : event.poolType.includes('日卡') ? '日卡'
              : '單人';
    document.querySelector(`input[name="subPool"][value="${sub}"]`).checked = true;
}

// ── 活動時間解析 ───────────────────────────────────────────
//    從 duration 欄位（格式 "M.D-M.D"）取出開始日期，
//    轉成 Unix timestamp（毫秒）以供排序使用。
function parseEventTime(e) {
    try {
        const startStr = e.duration.split('-')[0];
        const [m, d]   = startStr.split('.');
        return new Date(`${e.year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`).getTime();
    } catch { return 0; }
}

// ── 活動查詢 Helper ────────────────────────────────────────
//    findEvent：依活動名稱與主池類型（限定/復刻）找出最佳匹配。
//    getEventDate：取得活動的開始時間戳（常駐池固定回傳 0）。
function findEvent(eventName, mainPool) {
    if (typeof eventCards === 'undefined') return null;
    const matches = eventCards.filter(e => e.eventName === eventName);
    return matches.find(e =>
        mainPool === '復刻' ? e.poolType.includes('復刻') : !e.poolType.includes('復刻')
    ) || matches[0];
}

function getEventDate(eventName, mainPool) {
    if (mainPool === '常駐') return 0;
    const target = findEvent(eventName, mainPool);
    return target ? parseEventTime(target) : 0;
}

// ── 下拉選單 ───────────────────────────────────────────────
//    dropdownData 儲存各輸入欄位的候選清單，由 updateBannerRecommendations
//    或 updatePulledCardList 在適當時機填入。
let dropdownData = { bannerName: [], upCardName: [], cardName: [] };

function renderDropdown(inputId) {
    const wrapper = document.getElementById(inputId + 'ListWrapper');
    const input   = document.getElementById(inputId);
    const val     = input.value.toLowerCase();
    const list    = dropdownData[inputId];
    wrapper.innerHTML = '';
    let count = 0;
    list.forEach(item => {
        if (!item.toLowerCase().includes(val)) return;
        const div = document.createElement('div');
        div.className  = 'autocomplete-item';
        div.innerText  = item;
        div.onmousedown = () => {
            input.value = item;
            wrapper.style.display = 'none';
            // 選擇卡池名稱後自動填入子池類型
            if (inputId === 'bannerName') autoFillBannerInfo();
            // 選擇 UP 卡名後反查對應卡池
            if (inputId === 'upCardName') autoFillFromUpCard();
        };
        wrapper.appendChild(div);
        count++;
    });
    wrapper.style.display = count > 0 ? 'block' : 'none';
}

// ── 下拉選單 alias 說明 ────────────────────────────────────
//    HTML 的 oninput 屬性呼叫 filterDropdown，onfocus 屬性呼叫 showDropdown，
//    兩者行為完全相同（都重新渲染整個清單），此處以 alias 保持 HTML 語意清晰，
//    同時避免修改 HTML 標記。如需分離行為（例如 focus 時不過濾），
//    將 showDropdown 改為獨立函式即可。
const filterDropdown = renderDropdown;
const showDropdown   = renderDropdown;

function hideDropdownDelayed(inputId) {
    // 延遲 150ms 讓 onmousedown 有時間觸發後再隱藏，防止選項被提早收起
    setTimeout(() => {
        const w = document.getElementById(inputId + 'ListWrapper');
        if (w) w.style.display = 'none';
    }, 150);
}

// ── 卡池篩選與推薦 ─────────────────────────────────────────
//    依目前勾選的主池（限定/復刻/常駐）與副池（單人/日卡/混池）
//    過濾出合法的活動列表，並更新 dropdownData。
function updateBannerRecommendations() {
    const mainPool     = document.querySelector('input[name="mainPool"]:checked').value;
    const subPoolGroup = document.getElementById('subPoolGroup');

    if (mainPool === '常駐') {
        // 常駐池：副池選項無意義，降低透明度以提示使用者
        if (subPoolGroup) subPoolGroup.style.opacity = '0.3';
        dropdownData.bannerName = ['極空迴響'];
        dropdownData.upCardName = typeof standardCards !== 'undefined'
            ? [...new Set(Object.values(standardCards).flat())]
            : [];
        document.getElementById('bannerName').value = '極空迴響';
        return;
    }

    if (subPoolGroup) subPoolGroup.style.opacity = '1';
    if (typeof eventCards === 'undefined') return;
    const subPool = document.querySelector('input[name="subPool"]:checked').value;

    const filteredEvents = eventCards.filter(e => {
        const isRerun = e.poolType.includes('復刻');
        if (mainPool === '限定' && isRerun)  return false;
        if (mainPool === '復刻' && !isRerun) return false;
        // 依副池類型做第二層篩選
        if (subPool === '混池') return e.poolType.includes('混池');
        if (subPool === '日卡') return e.poolType.includes('日卡');
        // 「單人」涵蓋：單人池、生日池、免五池、純復刻
        return subPool === '單人' && (
            e.poolType.includes('單人') || e.poolType.includes('生日') ||
            e.poolType.includes('免五') || e.poolType === '復刻'
        );
    });

    // 由新到舊排序，讓下拉清單頂端顯示最近的活動
    filteredEvents.sort((a, b) => parseEventTime(b) - parseEventTime(a));
    dropdownData.bannerName = [...new Set(filteredEvents.map(e => e.eventName))];
    dropdownData.upCardName = [...new Set(filteredEvents.flatMap(e => Object.values(e.cards).flat()))];
}

function onPoolChange() {
    updateBannerRecommendations();
    updatePulledCardList();
}

// ── 自動填入：以卡名反查卡池 ──────────────────────────────
window.autoFillFromUpCard = function () {
    const upCardName     = document.getElementById('upCardName').value;
    if (!upCardName || typeof eventCards === 'undefined') return;
    const currentMainPool = document.querySelector('input[name="mainPool"]:checked').value;
    if (currentMainPool === '常駐') return;

    const matchingEvents = eventCards.filter(e =>
        Object.values(e.cards).some(cards => cards.includes(upCardName))
    );
    if (matchingEvents.length > 0) {
        // 優先選擇與目前主池類型相符的活動
        const best = matchingEvents.find(e =>
            (currentMainPool === '復刻' &&  e.poolType.includes('復刻')) ||
            (currentMainPool === '限定' && !e.poolType.includes('復刻'))
        ) || matchingEvents[0];
        document.getElementById('bannerName').value = best.eventName;
        window.autoFillBannerInfo(best);
    }
};

// ── 自動填入：以卡池名稱填入子池類型 ─────────────────────
window.autoFillBannerInfo = function (forcedEvent = null) {
    const bannerName = document.getElementById('bannerName').value;
    if (bannerName === '極空迴響') return; // 常駐池不需自動填入

    const event = forcedEvent || findEvent(
        bannerName,
        document.querySelector('input[name="mainPool"]:checked').value
    );
    if (event) {
        const isRerun = event.poolType.includes('復刻');
        document.querySelector(`input[name="mainPool"][value="${isRerun ? '復刻' : '限定'}"]`).checked = true;
        setSubPoolFromEvent(event); // 共用 helper，避免重複邏輯
    }
    onPoolChange();
};

// ── 更新「思念名稱」下拉清單 ──────────────────────────────
//    依目前選定的卡池與男主，合併活動卡池及常駐卡池的可選卡名。
window.updatePulledCardList = function () {
    const bannerName = document.getElementById('bannerName').value;
    const pulledLead = document.querySelector('input[name="pulledLead"]:checked').value;
    let options = [];
    if (bannerName && bannerName !== '極空迴響' && typeof eventCards !== 'undefined') {
        const event = findEvent(
            bannerName,
            document.querySelector('input[name="mainPool"]:checked').value
        );
        if (event?.cards?.[pulledLead]) options.push(...event.cards[pulledLead]);
    }
    // 常駐卡也加入選項（常駐池常會抽到同一男主的常駐五星）
    if (typeof standardCards !== 'undefined' && standardCards[pulledLead])
        options.push(...standardCards[pulledLead]);
    dropdownData.cardName = [...new Set(options)];
};

// ── 自動填入：OCR 辨識結果 ────────────────────────────────
window.autoFillFromOCR = function (
    pulls, 
    cardName, 
    latestTime, 
    pendingPulls, 
    rawText = '', 
    poolName = null
) {
    window.currentOCRTime = latestTime || null;
    window.currentPendingPulls = pendingPulls || 0;
    
    document.getElementById('pulls').value = pulls;
    if (!cardName || cardName === '未知' || cardName.includes('未知卡名')){
        return;
    }
    document.getElementById('cardName').value = cardName;

    let foundLead    = findTrueLead(cardName);
    let matchedEvent = null;

    // 【修正點】在常駐池提早 return 之前，先把男主選好
    if (foundLead) {
        const radio = document.querySelector(`input[name="pulledLead"][value="${foundLead}"]`);
        if (radio) radio.checked = true;
    }

    if (poolName === '常駐') {
        document.querySelector(`input[name="mainPool"][value="常駐"]`).checked = true;
        document.getElementById('bannerName').value = '極空迴響';
        onPoolChange();
        return;
    }

    if (typeof eventCards !== 'undefined') {
        const possibleEvents = eventCards.filter(ev =>
            Object.values(ev.cards).some(c => c.includes(cardName))
        );
        if (possibleEvents.length > 0) {
            // 優先比對年份（避免同名卡池混淆）
            const year = latestTime ? new Date(latestTime).getFullYear().toString() : null;
            matchedEvent = possibleEvents.find(ev => ev.year === year) || possibleEvents[0];
        } else if (latestTime) {
            // 找不到對應卡名時，以時間戳記推算最近的活動
            matchedEvent = eventCards.slice().reverse().find(ev => parseEventTime(ev) <= latestTime);
        }
    }

    if (matchedEvent) {
        const isRerun = matchedEvent.poolType.includes('復刻');
        document.querySelector(`input[name="mainPool"][value="${isRerun ? '復刻' : '限定'}"]`).checked = true;
        setSubPoolFromEvent(matchedEvent);
        document.getElementById('bannerName').value = matchedEvent.eventName;
    }

    // 備用邏輯：若 findTrueLead 未命中，從 matchedEvent 的 cards 再次確認男主
    if (!foundLead && matchedEvent) {
        for (const lead in matchedEvent.cards) {
            if (matchedEvent.cards[lead].includes(cardName)) { foundLead = lead; break; }
        }
        if (foundLead) {
            const radio = document.querySelector(`input[name="pulledLead"][value="${foundLead}"]`);
            if (radio) radio.checked = true;
        }
    }

    // 計算並設定當前池型的累計墊抽數
    const mainPoolValue = document.querySelector('input[name="mainPool"]:checked').value;
    const poolKey = mainPoolValue === '限定' ? 'lim' : (mainPoolValue === '復刻' ? 're' : 'std');

    let progress = window.currentPendingPulls;
    if (poolKey !== 'std') {
        // 是 UP 卡 → 墊抽重設；非 UP 卡（歪卡）→ 70 + 已墊（進入大保底階段）
        const isUpCard = !!(matchedEvent && foundLead && matchedEvent.cards[foundLead]?.includes(cardName));
        progress = isUpCard ? window.currentPendingPulls : (70 + window.currentPendingPulls);
    }
    setP(poolKey, progress);

    onPoolChange();
};
