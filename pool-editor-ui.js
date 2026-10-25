// ════════════════════════════════════════════════════════════
//  pool-editor-ui.js — 卡池資料管理面板：表單、編輯、頁籤切換、清單渲染
//  依賴 custom-pools.js（資料層）與 pool-logic.js / storage.js。
//  需在兩者之後載入。
// ════════════════════════════════════════════════════════════

// ── 編輯狀態：null 代表「新增模式」，有值代表正在編輯該筆自訂資料的 id ──
let editingEventId = null;
let editingStdId   = null;

const POOL_LEADS = ['祁煜', '沈星回', '黎深', '秦徹', '夏以晝'];

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

function leadIconOf(lead) {
    return (typeof leadIcons !== 'undefined' && leadIcons[lead]) || '';
}

// ── 動態補上編輯模式需要的 UI（編輯提示列、取消按鈕、限定／復刻分區標題）──
//    用 JS 補建，不需要改動 index.html，只更新本檔案即可。
function ensureEditUI() {
    // 1. 新增／編輯限定復刻卡池：提示列 ＋ 取消按鈕
    const eventTab = document.getElementById('peTab-event');
    if (eventTab && !document.getElementById('peEventEditBanner')) {
        const banner = document.createElement('div');
        banner.id = 'peEventEditBanner';
        banner.style.cssText = 'display:none; margin-bottom:12px; padding:8px 10px; border-radius:8px; border:1px dashed var(--primary); color:var(--primary); font-size:13px; font-weight:bold;';
        eventTab.prepend(banner);

        const cancel = document.createElement('button');
        cancel.id = 'peEventCancelBtn';
        cancel.type = 'button';
        cancel.className = 'pool-editor-addrow-btn';
        cancel.style.cssText = 'display:none; width:100%; margin-top:8px; padding:8px;';
        cancel.textContent = '✕ 取消編輯';
        cancel.onclick = () => { resetEventForm(); showPoolEditorTab('list'); };
        eventTab.querySelector('.main-btn').after(cancel);
    }

    // 2. 新增／編輯常駐卡：提示列 ＋ 取消按鈕
    const stdTab = document.getElementById('peTab-standard');
    if (stdTab && !document.getElementById('peStdEditBanner')) {
        const banner = document.createElement('div');
        banner.id = 'peStdEditBanner';
        banner.style.cssText = 'display:none; margin-bottom:12px; padding:8px 10px; border-radius:8px; border:1px dashed var(--primary); color:var(--primary); font-size:13px; font-weight:bold;';
        stdTab.prepend(banner);

        const cancel = document.createElement('button');
        cancel.id = 'peStdCancelBtn';
        cancel.type = 'button';
        cancel.className = 'pool-editor-addrow-btn';
        cancel.style.cssText = 'display:none; width:100%; margin-top:8px; padding:8px;';
        cancel.textContent = '✕ 取消編輯';
        cancel.onclick = () => { resetStdForm(); showPoolEditorTab('list'); };
        stdTab.querySelector('.main-btn').after(cancel);
    }

    // 3. 已新增項目：把「限定／復刻卡池」拆成「限定卡池」與「復刻卡池」兩區
    const eventList = document.getElementById('peEventList');
    if (eventList && !document.getElementById('peRerunList')) {
        const limitedHeader = eventList.previousElementSibling;
        if (limitedHeader) limitedHeader.textContent = '🎯 限定卡池';

        const rerunHeader = document.createElement('div');
        rerunHeader.className = 'section-header';
        rerunHeader.style.marginTop = '10px';
        rerunHeader.textContent = '🔄 復刻卡池';

        const rerunList = document.createElement('div');
        rerunList.id = 'peRerunList';

        eventList.after(rerunHeader, rerunList);
    }
}

// ── 面板開關 ───────────────────────────────────────────────
function togglePoolEditor() {
    ensureEditUI();
    const modal = document.getElementById('poolEditorModal');
    const isHidden = modal.style.display === 'none' || modal.style.display === '';
    modal.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) {
        resetEventForm();
        resetStdForm();
        renderPoolManagerLists();
    }
}

// ── 頁籤切換 ───────────────────────────────────────────────
function showPoolEditorTab(tab) {
    ['event', 'standard', 'list'].forEach(t => {
        const panel = document.getElementById(`peTab-${t}`);
        if (panel) panel.style.display = t === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.pool-editor-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    if (tab === 'list') renderPoolManagerLists();
}

// 使用者手動點頁籤：若正在編輯、卻切到別的頁籤，視為放棄編輯並還原表單
function switchPoolEditorTab(tab) {
    if (editingEventId !== null && tab !== 'event')    resetEventForm();
    if (editingStdId   !== null && tab !== 'standard') resetStdForm();
    showPoolEditorTab(tab);
}

// ── 卡池類型標籤：依「分類」＋「是否復刻」自動組出建議文字 ──
//    使用者仍可在輸入框中自行微調文字，這裡只是給預設值。
function updateCustomPoolTypeLabel() {
    const category = document.getElementById('peCategory').value;
    const isRerun  = document.getElementById('peIsRerun').checked;
    let label = category;
    if (isRerun) {
        if      (category === '混池')   label = '復刻混池';
        else if (category === '日卡池') label = '日卡池(復刻)';
        else if (category === '單人池') label = '單人池復刻';
        else if (category === '生日池') label = '復刻';
    }
    document.getElementById('peLabel').value = label;
}

// 由既有的 poolType 文字反推「分類」與「是否復刻」（編輯時用來還原表單）
function inferCategory(poolType) {
    if (poolType.includes('混池')) return '混池';
    if (poolType.includes('日卡')) return '日卡池';
    if (poolType.includes('生日')) return '生日池';
    return '單人池';
}

// ── UP 角色與思念卡：動態列（混池可新增多列）─────────────
function leadCardRowTemplate(lead = '祁煜', cardsText = '') {
    const div = document.createElement('div');
    div.className = 'pool-editor-leadcard-row';
    div.innerHTML = `
        <select class="pe-lead-select">
            ${POOL_LEADS.map(l => `<option value="${l}">${leadIconOf(l)} ${l}</option>`).join('')}
        </select>
        <input type="text" class="pe-card-input" placeholder="思念卡名，多張用、分隔">
        <button type="button" class="pool-editor-removerow-btn" onclick="this.parentElement.remove()" title="移除此列">✕</button>
    `;
    div.querySelector('.pe-lead-select').value = lead;
    div.querySelector('.pe-card-input').value  = cardsText;
    return div;
}

function addLeadCardRow() {
    document.getElementById('peLeadCardRows').appendChild(leadCardRowTemplate());
}

// ── 編輯模式的外觀切換（提示列、按鈕文字、取消鈕）────────
function setEventEditMode(ev) {
    editingEventId = ev ? ev.id : null;
    const banner = document.getElementById('peEventEditBanner');
    const cancel = document.getElementById('peEventCancelBtn');
    const submit = document.querySelector('#peTab-event .main-btn');
    if (banner) {
        banner.style.display = ev ? 'block' : 'none';
        banner.textContent   = ev ? `✏️ 編輯中：${ev.eventName}` : '';
    }
    if (cancel) cancel.style.display = ev ? 'block' : 'none';
    if (submit) submit.textContent   = ev ? '💾 儲存修改' : '✨ 新增此卡池';
}

function setStdEditMode(c) {
    editingStdId = c ? c.id : null;
    const banner = document.getElementById('peStdEditBanner');
    const cancel = document.getElementById('peStdCancelBtn');
    const submit = document.querySelector('#peTab-standard .main-btn');
    if (banner) {
        banner.style.display = c ? 'block' : 'none';
        banner.textContent   = c ? `✏️ 編輯中：${c.card}` : '';
    }
    if (cancel) cancel.style.display = c ? 'block' : 'none';
    if (submit) submit.textContent   = c ? '💾 儲存修改' : '✨ 新增此常駐卡';
}

// ── 重設「新增限定／復刻卡池」表單（同時離開編輯模式）─────
function resetEventForm() {
    const wrap = document.getElementById('peLeadCardRows');
    wrap.innerHTML = '';
    wrap.appendChild(leadCardRowTemplate());

    document.getElementById('peYear').value      = new Date().getFullYear();
    document.getElementById('peDuration').value  = '';
    document.getElementById('peEventName').value = '';
    document.getElementById('peIsRerun').checked = false;
    document.getElementById('peCategory').value  = '單人池';
    updateCustomPoolTypeLabel();
    setEventEditMode(null);
}

function resetStdForm() {
    document.getElementById('peStdCard').value = '';
    setStdEditMode(null);
}

// ── 開始編輯：限定／復刻卡池（把既有資料帶入表單）────────
function startEditEvent(id) {
    const ev = getCustomEvents().find(e => e.id === id);
    if (!ev) return alert('找不到這筆卡池資料，可能已被刪除。');

    resetStdForm();
    document.getElementById('peYear').value      = ev.year;
    document.getElementById('peDuration').value  = ev.duration;
    document.getElementById('peEventName').value = ev.eventName;
    document.getElementById('peCategory').value  = inferCategory(ev.poolType);
    document.getElementById('peIsRerun').checked = ev.poolType.includes('復刻');
    // 標籤直接帶入原本儲存的文字（不要被自動產生的建議文字蓋掉）
    document.getElementById('peLabel').value     = ev.poolType;

    const wrap = document.getElementById('peLeadCardRows');
    wrap.innerHTML = '';
    const entries = Object.entries(ev.cards);
    if (entries.length === 0) wrap.appendChild(leadCardRowTemplate());
    entries.forEach(([lead, cards]) => wrap.appendChild(leadCardRowTemplate(lead, cards.join('、'))));

    setEventEditMode(ev);
    showPoolEditorTab('event');
    document.querySelector('.pool-editor-panel').scrollTop = 0;
}

// ── 開始編輯：常駐卡 ───────────────────────────────────────
function startEditStandardCard(id) {
    const c = getCustomStandard().find(x => x.id === id);
    if (!c) return alert('找不到這張常駐卡，可能已被刪除。');

    resetEventForm();
    document.getElementById('peStdLead').value = c.lead;
    document.getElementById('peStdCard').value = c.card;

    setStdEditMode(c);
    showPoolEditorTab('standard');
    document.querySelector('.pool-editor-panel').scrollTop = 0;
}

// ── 卡池改名時：詢問是否同步更新已登錄紀錄裡的卡池名稱 ──
//    紀錄是用「卡池名稱」去對應卡池，名稱改了而紀錄沒跟著改，
//    那些紀錄就找不到卡池，UP 判定會變成歪卡。
//    回傳 true 代表紀錄已同步改名（後續流程要改用新名稱找紀錄）。
function syncRecordBannerName(oldName, newName) {
    if (typeof getDB !== 'function' || typeof setDB !== 'function') return false;
    const affected = getDB().filter(r => r.banner === oldName).length;
    if (affected === 0) return false;

    const doSync = confirm(
        `卡池名稱由「${oldName}」改為「${newName}」。\n\n` +
        `目前有 ${affected} 筆抽卡紀錄使用舊名稱。\n` +
        `按「確定」：同步把這些紀錄改成新名稱（建議）。\n` +
        `按「取消」：紀錄維持舊名稱，這些紀錄將找不到對應卡池，UP 判定會變成歪卡。`
    );
    if (!doSync) return false;

    const db = getDB();
    db.forEach(r => { if (r.banner === oldName) r.banner = newName; });
    setDB(db);
    return true;
}

// ── 卡池在「限定／復刻」間切換時：詢問是否同步調整已登錄紀錄的分類 ──
//    紀錄的 main 欄位（限定／復刻）決定它算進哪一個統計欄位，
//    卡池分類改了而紀錄沒跟著改，統計就會繼續算在原本的池子。
const poolMainOf = (poolType) => poolType.includes('復刻') ? '復刻' : '限定';

function syncRecordMainPool(name, oldMain, newMain, selfId) {
    if (typeof getDB !== 'function' || typeof setDB !== 'function') return;
    const affected = getDB().filter(r => r.banner === name && r.main === oldMain).length;
    if (affected === 0) return;

    // 復刻池常與原限定池同名：若還有別的同名卡池屬於舊分類，這些紀錄可能是屬於它的
    const hasSibling = typeof eventCards !== 'undefined' && eventCards.some(e =>
        e.eventName === name &&
        !(e._custom && e.id === selfId) &&
        poolMainOf(e.poolType) === oldMain
    );

    const doSync = confirm(
        `卡池「${name}」由「${oldMain}池」改為「${newMain}池」。\n\n` +
        `目前有 ${affected} 筆抽卡紀錄屬於「${oldMain}池」。\n` +
        `按「確定」：同步把這些紀錄改成「${newMain}池」（建議）。\n` +
        `按「取消」：紀錄維持在「${oldMain}池」，統計會繼續算在原本的池子。\n\n` +
        (hasSibling
            ? `⚠️ 注意：目前還有另一個同名的${oldMain}卡池，這些紀錄有可能是屬於它的，請確認後再同步。\n\n`
            : '') +
        `（系統不會自動調整右上角的「已墊抽數」。）`
    );
    if (!doSync) return;

    const db = getDB();
    db.forEach(r => { if (r.banner === name && r.main === oldMain) r.main = newMain; });
    setDB(db);
}

// ── 送出：新增／儲存修改 限定／復刻卡池 ───────────────────
function submitCustomEvent() {
    const year      = document.getElementById('peYear').value.trim();
    const duration  = document.getElementById('peDuration').value.trim();
    const eventName = document.getElementById('peEventName').value.trim();
    const poolType  = document.getElementById('peLabel').value.trim();

    if (!year || !duration || !eventName || !poolType) {
        return alert('請完整填寫年份、日期、卡池名稱與卡池類型標籤！');
    }
    if (!/^\d{1,2}\.\d{1,2}-\d{1,2}\.\d{1,2}$/.test(duration)) {
        return alert('日期格式錯誤，請使用「M.D-M.D」格式，例如 8.17-8.31');
    }

    const cards = {};
    document.querySelectorAll('#peLeadCardRows .pool-editor-leadcard-row').forEach(row => {
        const lead     = row.querySelector('.pe-lead-select').value;
        const cardText = row.querySelector('.pe-card-input').value.trim();
        if (!cardText) return;
        const cardNames = cardText.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
        if (cardNames.length === 0) return;
        cards[lead] = (cards[lead] || []).concat(cardNames);
    });

    if (Object.keys(cards).length === 0) {
        return alert('請至少填寫一位角色的思念卡名！');
    }

    const data = { year, duration, eventName, poolType, cards };

    if (editingEventId !== null) {
        const before = getCustomEvents().find(e => e.id === editingEventId);
        // 先處理紀錄同步（改名、限定／復刻切換），再更新卡池（避免更新後紀錄瞬間找不到卡池）
        if (before) {
            let recordName = before.eventName;
            if (before.eventName !== eventName && syncRecordBannerName(before.eventName, eventName)) {
                recordName = eventName; // 紀錄已改成新名稱，後續用新名稱找紀錄
            }
            const oldMain = poolMainOf(before.poolType);
            const newMain = poolMainOf(poolType);
            if (oldMain !== newMain) syncRecordMainPool(recordName, oldMain, newMain, before.id);
        }
        if (!updateCustomEvent(editingEventId, data)) {
            resetEventForm();
            return alert('找不到這筆卡池資料，可能已被刪除。');
        }
        alert(`已儲存卡池「${eventName}」的修改！`);
    } else {
        addCustomEvent(data);
        alert(`已新增卡池「${eventName}」！\n現在就能在上方表單的下拉選單中選到它了。`);
    }
    resetEventForm();
    showPoolEditorTab('list');
}

// ── 送出：新增／儲存修改 常駐卡 ───────────────────────────
function submitCustomStandardCard() {
    const lead = document.getElementById('peStdLead').value;
    const card = document.getElementById('peStdCard').value.trim();
    if (!card) return alert('請輸入思念卡名！');

    // 避免重複：同男主下已經有同名卡（內建或其他自訂項目）就不重複加入
    const before   = editingStdId !== null ? getCustomStandard().find(c => c.id === editingStdId) : null;
    const unchanged = before && before.lead === lead && before.card === card;
    if (!unchanged && typeof standardCards !== 'undefined' && standardCards[lead]?.includes(card)) {
        return alert(`${lead} 的常駐卡已經有「${card}」了！`);
    }

    if (editingStdId !== null) {
        if (!updateCustomStandardCard(editingStdId, lead, card)) {
            resetStdForm();
            return alert('找不到這張常駐卡，可能已被刪除。');
        }
        alert(`已儲存常駐卡「${card}」的修改！`);
    } else {
        addCustomStandardCard(lead, card);
        alert(`已新增常駐卡「${card}」！`);
    }
    resetStdForm();
    showPoolEditorTab('list');
}

// ── 已新增項目清單 ─────────────────────────────────────────
//    限定卡池／復刻卡池分開顯示，各自依「卡池開啟時間」由新到舊排序
//    （與主畫面下拉選單、抽卡紀錄的排序方向一致）。
function sortByEventTimeDesc(events) {
    const t = (e) => (typeof parseEventTime === 'function' ? parseEventTime(e) : 0);
    return [...events].sort((a, b) => (t(b) - t(a)) || (b.id - a.id));
}

function renderEventItem(ev) {
    const cardSummary = Object.entries(ev.cards)
        .map(([lead, cs]) => `${leadIconOf(lead)}${escapeHtml(lead)}：${cs.map(escapeHtml).join('、')}`)
        .join('｜');
    return `
    <div class="pool-editor-list-item">
        <div>
            <div class="pool-editor-list-title">${escapeHtml(ev.eventName)}　<span class="pool-editor-list-tag">${escapeHtml(ev.poolType)}</span></div>
            <div class="pool-editor-list-sub">${escapeHtml(ev.year)} / ${escapeHtml(ev.duration)}　${cardSummary}</div>
        </div>
        <div style="display:flex; flex-shrink:0;">
            <button class="del-btn-icon" title="編輯" onclick="startEditEvent(${ev.id})">✏️</button>
            <button class="del-btn-icon" title="刪除" onclick="deleteCustomEvent(${ev.id})">🗑️</button>
        </div>
    </div>`;
}

function renderPoolManagerLists() {
    ensureEditUI();
    const limitedEl = document.getElementById('peEventList');
    const rerunEl   = document.getElementById('peRerunList');
    const stdListEl = document.getElementById('peStandardList');
    if (!limitedEl || !rerunEl || !stdListEl) return; // 面板還沒開啟過也沒關係

    const events  = sortByEventTimeDesc(typeof getCustomEvents === 'function' ? getCustomEvents() : []);
    const limited = events.filter(e => !e.poolType.includes('復刻'));
    const rerun   = events.filter(e =>  e.poolType.includes('復刻'));
    const stds    = typeof getCustomStandard === 'function' ? getCustomStandard() : [];

    limitedEl.innerHTML = limited.length > 0
        ? limited.map(renderEventItem).join('')
        : '<div class="pool-editor-empty">尚未新增任何限定卡池</div>';

    rerunEl.innerHTML = rerun.length > 0
        ? rerun.map(renderEventItem).join('')
        : '<div class="pool-editor-empty">尚未新增任何復刻卡池</div>';

    stdListEl.innerHTML = stds.length > 0
        ? stds.map(c => `
            <div class="pool-editor-list-item">
                <div class="pool-editor-list-title">${leadIconOf(c.lead)}${escapeHtml(c.lead)}：${escapeHtml(c.card)}</div>
                <div style="display:flex; flex-shrink:0;">
                    <button class="del-btn-icon" title="編輯" onclick="startEditStandardCard(${c.id})">✏️</button>
                    <button class="del-btn-icon" title="刪除" onclick="deleteCustomStandardCard(${c.id})">🗑️</button>
                </div>
            </div>`).join('')
        : '<div class="pool-editor-empty">尚未新增任何常駐卡</div>';
}
