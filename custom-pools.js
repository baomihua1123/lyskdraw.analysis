// ════════════════════════════════════════════════════════════
//  custom-pools.js — 使用者自訂卡池資料（新增／刪除／合併／匯出入）
//
//  ⚠️ 載入順序很重要：必須放在
//     love_and_deepspace_events.js / love_and_deepspace_standard.js 之後，
//     ocr_parser.js 與 pool-logic.js 之前。
//  這樣頁面一載入，使用者先前新增的自訂卡池／常駐卡，
//  就會在 cardToLeadMap（pool-logic.js）與 KNOWN_CARDS（ocr_parser.js）
//  建立之前就先併入 eventCards / standardCards，
//  讓下拉選單、OCR辨識、抽卡判定都能自然涵蓋自訂資料，完全不用改動
//  pool-logic.js／records.js／render.js 既有的邏輯。
// ════════════════════════════════════════════════════════════

const CUSTOM_EVENTS_KEY   = 'customEventCards_v1';
const CUSTOM_STANDARD_KEY = 'customStandardCards_v1';

// ── LocalStorage 存取 ──────────────────────────────────────
const getCustomEvents   = () => JSON.parse(localStorage.getItem(CUSTOM_EVENTS_KEY))   || [];
const getCustomStandard = () => JSON.parse(localStorage.getItem(CUSTOM_STANDARD_KEY)) || [];
const saveCustomEvents   = (list) => localStorage.setItem(CUSTOM_EVENTS_KEY,   JSON.stringify(list));
const saveCustomStandard = (list) => localStorage.setItem(CUSTOM_STANDARD_KEY, JSON.stringify(list));

// ── 合併：把使用者先前新增的自訂資料併入全域 eventCards / standardCards ──
//    只在腳本載入當下執行一次。
//    events：直接 push 進 eventCards（並標記 _custom 以利日後刪除比對）
//    standard：併入對應男主的常駐卡陣列，並避免重複
function mergeCustomPoolData() {
    if (typeof eventCards !== 'undefined') {
        getCustomEvents().forEach(ev => {
            ev._custom = true;
            eventCards.push(ev);
        });
    }
    if (typeof standardCards !== 'undefined') {
        getCustomStandard().forEach(({ lead, card }) => {
            if (!standardCards[lead]) standardCards[lead] = [];
            if (!standardCards[lead].includes(card)) standardCards[lead].push(card);
        });
    }
}
mergeCustomPoolData();

// ── 每次新增／刪除自訂資料後：重建 cardToLeadMap 並刷新畫面 ──
//    不需要重新整理頁面即可讓變更立即生效。
function afterCustomPoolChange() {
    if (typeof window.rebuildCardToLeadMap === 'function') window.rebuildCardToLeadMap();
    if (typeof updateBannerRecommendations === 'function') updateBannerRecommendations();
    if (typeof updatePulledCardList === 'function') updatePulledCardList();
    if (typeof renderPoolManagerLists === 'function') renderPoolManagerLists();
}

// ── 新增：限定／復刻卡池 ──────────────────────────────────
//    eventObj 格式：{ year, duration, eventName, poolType, cards: { 男主: [卡名,...] } }
window.addCustomEvent = function (eventObj) {
    eventObj.id      = Date.now();
    eventObj._custom = true;

    const list = getCustomEvents();
    list.push(eventObj);
    saveCustomEvents(list);

    if (typeof eventCards !== 'undefined') eventCards.push(eventObj);
    afterCustomPoolChange();
};

// ── 刪除：限定／復刻卡池（只能刪除自訂新增的，內建資料不受影響）──
window.deleteCustomEvent = function (id) {
    saveCustomEvents(getCustomEvents().filter(e => e.id !== id));

    if (typeof eventCards !== 'undefined') {
        const idx = eventCards.findIndex(e => e._custom && e.id === id);
        if (idx !== -1) eventCards.splice(idx, 1);
    }
    afterCustomPoolChange();
};

// ── 新增：常駐卡 ───────────────────────────────────────────
window.addCustomStandardCard = function (lead, card) {
    const list = getCustomStandard();
    list.push({ id: Date.now(), lead, card });
    saveCustomStandard(list);

    if (typeof standardCards !== 'undefined') {
        if (!standardCards[lead]) standardCards[lead] = [];
        if (!standardCards[lead].includes(card)) standardCards[lead].push(card);
    }
    afterCustomPoolChange();
};

// ── 刪除：常駐卡 ───────────────────────────────────────────
window.deleteCustomStandardCard = function (id) {
    const list   = getCustomStandard();
    const target = list.find(c => c.id === id);
    if (!target) return;

    saveCustomStandard(list.filter(c => c.id !== id));

    if (typeof standardCards !== 'undefined' && standardCards[target.lead]) {
        const idx = standardCards[target.lead].indexOf(target.card);
        if (idx !== -1) standardCards[target.lead].splice(idx, 1);
    }
    afterCustomPoolChange();
};

// ── 匯出自訂卡池資料（JSON 檔，方便備份／換裝置使用）─────
window.exportPoolData = function () {
    const payload = {
        events:     getCustomEvents(),
        standard:   getCustomStandard(),
        exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `卡池資料備份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// ── 匯入自訂卡池資料（與現有自訂資料合併，不覆蓋、以內容去重）──
window.importPoolData = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data.events) || !Array.isArray(data.standard)) {
                throw new Error('格式不正確');
            }
            if (!confirm(
                `確定要匯入 ${data.events.length} 筆卡池資料與 ${data.standard.length} 筆常駐卡嗎？\n` +
                `（將與目前已新增的自訂資料合併，不會刪除既有內容）`
            )) return;

            const mergedEvents = [...getCustomEvents()];
            data.events.forEach(ev => {
                const dup = mergedEvents.some(e =>
                    e.eventName === ev.eventName && e.year === ev.year && e.duration === ev.duration
                );
                if (!dup) mergedEvents.push(ev);
            });
            saveCustomEvents(mergedEvents);

            const mergedStandard = [...getCustomStandard()];
            data.standard.forEach(c => {
                const dup = mergedStandard.some(x => x.lead === c.lead && x.card === c.card);
                if (!dup) mergedStandard.push(c);
            });
            saveCustomStandard(mergedStandard);

            alert('匯入完成，頁面即將重新整理套用資料。');
            location.reload();
        } catch (err) {
            alert('匯入失敗：檔案格式不正確，請確認是本工具匯出的備份檔。');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
};
