// ════════════════════════════════════════════════════════════
//  pool-logic.js — 卡池規則、下拉選單、自動填入
// ════════════════════════════════════════════════════════════

// ── O(1) 卡名 → 角色 對照表 ───────────────────────────────
//    在靜態資料載入後一次性建立，取代原本 O(n) 的迭代搜尋
const cardToLeadMap = (() => {
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
})();

function findTrueLead(cardName) {
    return cardToLeadMap.get(cardName) ?? null;
}

// ── 共用 Helper：依 poolType 設定 subPool 選項 ─────────────
//    原本重複 3 次的邏輯，統一由此函式處理
function setSubPoolFromEvent(event) {
    const sub = event.poolType.includes('混池') ? '混池'
              : event.poolType.includes('日卡') ? '日卡'
              : '單人';
    document.querySelector(`input[name="subPool"][value="${sub}"]`).checked = true;
}

// ── 活動時間解析 ───────────────────────────────────────────
function parseEventTime(e) {
    try {
        const startStr = e.duration.split('-')[0];
        const [m, d] = startStr.split('.');
        return new Date(`${e.year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`).getTime();
    } catch { return 0; }
}

// ── 活動查詢 Helper ────────────────────────────────────────
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
        div.className = 'autocomplete-item';
        div.innerText = item;
        div.onmousedown = () => {
            input.value = item;
            wrapper.style.display = 'none';
            if (inputId === 'bannerName') autoFillBannerInfo();
            if (inputId === 'upCardName') autoFillFromUpCard();
        };
        wrapper.appendChild(div);
        count++;
    });
    wrapper.style.display = count > 0 ? 'block' : 'none';
}

// HTML 中的 oninput / onfocus 皆指向同一函式
const filterDropdown = renderDropdown;
const showDropdown   = renderDropdown;

function hideDropdownDelayed(inputId) {
    setTimeout(() => {
        const w = document.getElementById(inputId + 'ListWrapper');
        if (w) w.style.display = 'none';
    }, 150);
}

// ── 卡池篩選與推薦 ─────────────────────────────────────────
function updateBannerRecommendations() {
    const mainPool    = document.querySelector('input[name="mainPool"]:checked').value;
    const subPoolGroup = document.getElementById('subPoolGroup');

    if (mainPool === '常駐') {
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
        if (subPool === '混池' && e.poolType.includes('混池')) return true;
        if (subPool === '日卡' && e.poolType.includes('日卡')) return true;
        return subPool === '單人' && (
            e.poolType.includes('單人') || e.poolType.includes('生日') ||
            e.poolType.includes('免五') || e.poolType === '復刻'
        );
    });

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
    const upCardName = document.getElementById('upCardName').value;
    if (!upCardName || typeof eventCards === 'undefined') return;
    const currentMainPool = document.querySelector('input[name="mainPool"]:checked').value;
    if (currentMainPool === '常駐') return;

    const matchingEvents = eventCards.filter(e =>
        Object.values(e.cards).some(cards => cards.includes(upCardName))
    );
    if (matchingEvents.length > 0) {
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
    if (bannerName === '極空迴響') return;

    const event = forcedEvent || findEvent(
        bannerName,
        document.querySelector('input[name="mainPool"]:checked').value
    );
    if (event) {
        const isRerun = event.poolType.includes('復刻');
        document.querySelector(`input[name="mainPool"][value="${isRerun ? '復刻' : '限定'}"]`).checked = true;
        setSubPoolFromEvent(event); // ← 共用 helper 取代重複邏輯
    }
    onPoolChange();
};

// ── 更新「思念名稱」下拉清單 ──────────────────────────────
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
    if (typeof standardCards !== 'undefined' && standardCards[pulledLead])
        options.push(...standardCards[pulledLead]);
    dropdownData.cardName = [...new Set(options)];
}

// ── 自動填入：OCR 辨識結果 ────────────────────────────────
window.autoFillFromOCR = function (pulls, cardName, latestTime, pendingPulls, rawText = '', poolName = null) {
    window.currentPendingPulls = pendingPulls || 0;
    document.getElementById('pulls').value = pulls;
    if (!cardName || cardName === '未知' || cardName.includes('未知卡名')) return;
    document.getElementById('cardName').value = cardName;

    let foundLead = findTrueLead(cardName);
    let matchedEvent = null;

    // 【修正點】：在常駐池提早 return 之前，先把男主選好
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
            const year = latestTime ? new Date(latestTime).getFullYear().toString() : null;
            matchedEvent = possibleEvents.find(ev => ev.year === year) || possibleEvents[0];
        } else if (latestTime) {
            matchedEvent = eventCards.slice().reverse().find(ev => parseEventTime(ev) <= latestTime);
        }
    }

    if (matchedEvent) {
        const isRerun = matchedEvent.poolType.includes('復刻');
        document.querySelector(`input[name="mainPool"][value="${isRerun ? '復刻' : '限定'}"]`).checked = true;
        setSubPoolFromEvent(matchedEvent); 
        document.getElementById('bannerName').value = matchedEvent.eventName;
    }

    // 備用邏輯：如果前面沒找到，從 eventCards 再次確認
    if (!foundLead && matchedEvent) {
        for (const lead in matchedEvent.cards) {
            if (matchedEvent.cards[lead].includes(cardName)) { foundLead = lead; break; }
        }
        if (foundLead) {
            const radio = document.querySelector(`input[name="pulledLead"][value="${foundLead}"]`);
            if (radio) radio.checked = true;
        }
    }

    const mainPoolValue = document.querySelector('input[name="mainPool"]:checked').value;
    const poolKey = mainPoolValue === '限定' ? 'lim' : (mainPoolValue === '復刻' ? 're' : 'std');

    let progress = window.currentPendingPulls;
    if (poolKey !== 'std') {
        const isUpCard = !!(matchedEvent && foundLead && matchedEvent.cards[foundLead]?.includes(cardName));
        progress = isUpCard ? window.currentPendingPulls : (70 + window.currentPendingPulls);
    }
    setP(poolKey, progress);

    onPoolChange();
};
