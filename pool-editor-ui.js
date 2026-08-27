// ════════════════════════════════════════════════════════════
//  pool-editor-ui.js — 卡池資料管理面板：表單、頁籤切換、清單渲染
//  依賴 custom-pools.js（資料層）與 pool-logic.js / storage.js。
//  需在兩者之後載入。
// ════════════════════════════════════════════════════════════

// ── 面板開關 ───────────────────────────────────────────────
function togglePoolEditor() {
    const modal = document.getElementById('poolEditorModal');
    const isHidden = modal.style.display === 'none' || modal.style.display === '';
    modal.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) {
        resetEventForm();
        updateCustomPoolTypeLabel();
        renderPoolManagerLists();
    }
}

// ── 頁籤切換 ───────────────────────────────────────────────
function switchPoolEditorTab(tab) {
    ['event', 'standard', 'list'].forEach(t => {
        const panel = document.getElementById(`peTab-${t}`);
        if (panel) panel.style.display = t === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.pool-editor-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    if (tab === 'list') renderPoolManagerLists();
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

// ── UP 角色與思念卡：動態列（混池可新增多列）─────────────
function leadCardRowTemplate() {
    const div = document.createElement('div');
    div.className = 'pool-editor-leadcard-row';
    div.innerHTML = `
        <select class="pe-lead-select">
            <option value="祁煜">🐟 祁煜</option>
            <option value="沈星回">🌟 沈星回</option>
            <option value="黎深">🍐 黎深</option>
            <option value="秦徹">🚘 秦徹</option>
            <option value="夏以晝">🍎 夏以晝</option>
        </select>
        <input type="text" class="pe-card-input" placeholder="思念卡名，多張用、分隔">
        <button type="button" class="pool-editor-removerow-btn" onclick="this.parentElement.remove()" title="移除此列">✕</button>
    `;
    return div;
}

function addLeadCardRow() {
    document.getElementById('peLeadCardRows').appendChild(leadCardRowTemplate());
}

// ── 重設「新增限定／復刻卡池」表單 ────────────────────────
function resetEventForm() {
    const wrap = document.getElementById('peLeadCardRows');
    wrap.innerHTML = '';
    wrap.appendChild(leadCardRowTemplate());

    document.getElementById('peYear').value      = new Date().getFullYear();
    document.getElementById('peDuration').value  = '';
    document.getElementById('peEventName').value = '';
    document.getElementById('peIsRerun').checked = false;
    document.getElementById('peCategory').value  = '單人池';
}

// ── 送出：新增限定／復刻卡池 ──────────────────────────────
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

    addCustomEvent({ year, duration, eventName, poolType, cards });
    alert(`已新增卡池「${eventName}」！\n現在就能在上方表單的下拉選單中選到它了。`);
    resetEventForm();
    switchPoolEditorTab('list');
}

// ── 送出：新增常駐卡 ───────────────────────────────────────
function submitCustomStandardCard() {
    const lead = document.getElementById('peStdLead').value;
    const card = document.getElementById('peStdCard').value.trim();
    if (!card) return alert('請輸入思念卡名！');

    addCustomStandardCard(lead, card);
    alert(`已新增常駐卡「${card}」！`);
    document.getElementById('peStdCard').value = '';
    switchPoolEditorTab('list');
}

// ── 已新增項目清單（限定／復刻卡池 ＋ 常駐卡）─────────────
function renderPoolManagerLists() {
    const eventListEl = document.getElementById('peEventList');
    const stdListEl    = document.getElementById('peStandardList');
    if (!eventListEl || !stdListEl) return; // 面板還沒開啟過也沒關係

    const events = (typeof getCustomEvents === 'function') ? getCustomEvents() : [];
    const stds   = (typeof getCustomStandard === 'function') ? getCustomStandard() : [];

    eventListEl.innerHTML = events.length > 0
        ? events.map(ev => {
            const cardSummary = Object.entries(ev.cards)
                .map(([lead, cs]) => `${(typeof leadIcons !== 'undefined' && leadIcons[lead]) || ''}${lead}：${cs.join('、')}`)
                .join('｜');
            return `
            <div class="pool-editor-list-item">
                <div>
                    <div class="pool-editor-list-title">${ev.eventName}　<span class="pool-editor-list-tag">${ev.poolType}</span></div>
                    <div class="pool-editor-list-sub">${ev.year} / ${ev.duration}　${cardSummary}</div>
                </div>
                <button class="del-btn-icon" title="刪除" onclick="deleteCustomEvent(${ev.id})">🗑️</button>
            </div>`;
        }).join('')
        : '<div class="pool-editor-empty">尚未新增任何限定／復刻卡池</div>';

    stdListEl.innerHTML = stds.length > 0
        ? stds.map(c => `
            <div class="pool-editor-list-item">
                <div class="pool-editor-list-title">${(typeof leadIcons !== 'undefined' && leadIcons[c.lead]) || ''}${c.lead}：${c.card}</div>
                <button class="del-btn-icon" title="刪除" onclick="deleteCustomStandardCard(${c.id})">🗑️</button>
            </div>`).join('')
        : '<div class="pool-editor-empty">尚未新增任何常駐卡</div>';
}
