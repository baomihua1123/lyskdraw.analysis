// ════════════════════════════════════════════════════════════
//  records.js — 紀錄增刪改、幸運判定、統計面板
// ════════════════════════════════════════════════════════════

// ── 幸運判定（單次紀錄卡片用）─────────────────────────────
//    judgeS：常駐池或歪卡（無大保底，單純以抽數論幸運）
//    judgeT：限定/復刻 UP 卡（有大保底機制，門檻較寬鬆）
//    回傳 { t: 顯示文字, c: 顏色 HEX }
const judgeS = (p) =>
    p <= 16 ? { t: '天選之子 ✨', c: '#16a34a' } :
    p <= 40 ? { t: '幸運兒 🌟',  c: '#4ade80' } :
    p <= 61 ? { t: '平凡人 😐',  c: '#facc15' } :
    p <= 65 ? { t: '小不幸運 🌧️', c: '#fb923c' } :
              { t: '小倒霉鬼 🌩️', c: '#dc2626' };

const judgeT = (p) =>
    p <= 30 ? { t: '天選之子 ✨', c: '#16a34a' } :
    p <= 62 ? { t: '幸運兒 🌟',  c: '#4ade80' } :
    p <= 65 ? { t: '平凡人 😐',  c: '#facc15' } :
    p <= 68 ? { t: '小不幸運 🌧️', c: '#fb923c' } :
              { t: '小倒霉鬼 🌩️', c: '#dc2626' };

// ── 統計面板幸運等級定義表 ─────────────────────────────────
//    【精簡】原本 getLuckHtml 的兩個分支（isTarget / else）各自
//    把等級文字與 CSS class 硬寫一次，現在統一抽到此處，
//    只要維護這一張表，judgeS 的門檻與 HTML 輸出就永遠同步。
const LUCK_HTML_LEVELS = [
    { cls: 'title-god',     label: '✨ 天選之子' },
    { cls: 'title-lucky',   label: '🌟 幸運兒'   },
    { cls: 'title-plain',   label: '😐 平凡人'   },
    { cls: 'title-unlucky', label: '🌧️ 小不幸運' },
    { cls: 'title-bad',     label: '🌩️ 小倒霉鬼' },
];

// 依「超越百分比」映射到等級索引（限定/復刻池使用）
function getLuckRankByPercent(beatPercent) {
    if (beatPercent >= 85)   return 0;
    if (beatPercent >= 63.5) return 1;
    if (beatPercent >= 48)   return 2;
    if (beatPercent >= 32.5) return 3;
    return 4;
}

// 依「抽數」映射到等級索引（與 judgeS 的閾值保持一致）
function getLuckRankByPulls(p) {
    if (p <= 16) return 0;
    if (p <= 40) return 1;
    if (p <= 61) return 2;
    if (p <= 65) return 3;
    return 4;
}

// ── 四欄統計：幸運標籤 HTML ───────────────────────────────
//    【精簡】isTarget = true  → 用 beatPercent 判斷（限定/復刻）
//            isTarget = false → 用抽數判斷（常駐，與 judgeS 同門檻）
//    移至 updateLuckStats 外部，避免每次呼叫都重建函式物件。
function getLuckHtml(avgPulls, isTarget) {
    if (avgPulls === 0) return '<span style="color:var(--text-sub)">---</span>';

    const pullCount   = Math.max(1, Math.min(140, Math.round(avgPulls)));
    // 改後
    const table       = isTarget ? beatPercentTable : standardBeatPercentTable;
    const beatPercent = (typeof table !== 'undefined') ? (table[pullCount] ?? 0) : 0;
    const rank        = getLuckRankByPercent(beatPercent); // 兩種池型都用百分比判斷
    const { cls, label } = LUCK_HTML_LEVELS[rank];

    const mainHtml    = `<span class="${cls}">${label}</span>`;
    const percentHtml = `<span style="display:block; font-size:11px; color:var(--text-sub); font-weight:normal; margin-top:3px;">超越 ${beatPercent}% 玩家</span>`;
    return mainHtml + percentHtml;
}

// ── 四欄統計面板 ──────────────────────────────────────────
function updateLuckStats(db = getDB()) {

    // 內部 helper：將計算好的數值填入對應的 DOM 卡片
    function populateCard(prefix, pulls, targetCount, total5Count, avg, luckHtml, showDiamonds) {
        document.getElementById(`stat${prefix}Pulls`).innerText = pulls;
        const diaEl = document.getElementById(`stat${prefix}Diamonds`);
        if (diaEl) {
            if (showDiamonds) {
                diaEl.innerText = `(${(pulls * 150).toLocaleString()} 鑽)`;
                diaEl.style.visibility = 'visible';
            } else {
                diaEl.style.visibility = 'hidden';
            }
        }
        document.getElementById(`stat${prefix}Luck`).innerHTML = luckHtml;

        // 常駐池只顯示總五星數，限定/復刻顯示「目標數/總五星數」
        if (prefix === 'Std') {
            document.getElementById(`stat${prefix}Count`).innerText = total5Count;
        } else {
            document.getElementById(`stat${prefix}Count`).innerText = `${targetCount}/${total5Count}`;
        }
        document.getElementById(`stat${prefix}Avg`).innerText = avg > 0 ? avg.toFixed(1) : '0.0';
    }

    // 內部 helper：由一組紀錄計算統計數值，再呼叫 populateCard
    function computeAndRender(prefix, records, isTarget, showDiamonds) {
        const pulls = records.reduce((sum, r) => sum + r.pulls, 0);
        // isTarget = true  → 只對「目標卡」計算平均抽數（限定/復刻）
        // isTarget = false → 對全部紀錄計算平均抽數（常駐）
        const avgSource   = isTarget ? records.filter(r => r.res === 'target') : records;
        const avg         = avgSource.length > 0
            ? avgSource.reduce((s, r) => s + r.total, 0) / avgSource.length
            : 0;
        // 常駐池 targetCount 傳 0，populateCard 內部會依 prefix 決定顯示格式
        const targetCount = isTarget ? avgSource.length : 0;
        populateCard(prefix, pulls, targetCount, records.length, avg, getLuckHtml(avg, isTarget), showDiamonds);
    }

    // ── 【精簡】一次迴圈完成分組，取代原本四次獨立 filter ──
    const subType = document.getElementById('statSubPoolSelect').value;
    const groups  = { '限定': [], '常駐': [], '復刻': [], sub: [] };
    db.forEach(r => {
        // 依主池類型分桶
        if (groups[r.main]) groups[r.main].push(r);
        // 同時收集符合自訂副池條件的紀錄
        if ((r.main === '限定' || r.main === '復刻') && r.sub === subType)
            groups.sub.push(r);
    });

    computeAndRender('Lim', groups['限定'], true,  true);
    computeAndRender('Std', groups['常駐'], false, false);
    computeAndRender('Re',  groups['復刻'], true,  true);
    computeAndRender('Sub', groups.sub,     true,  true);
}

// ── 手動修改已墊抽數 ───────────────────────────────────────
function editPending(type) {
    const max = type === 'std' ? 69 : 139;
    const v = prompt(`手動修改『已墊抽數』\n(請輸入您目前已經墊了幾抽，0~${max})：`, getP(type));
    if (v !== null && !isNaN(parseInt(v))) setP(type, parseInt(v));
}

// ── 新增紀錄 ───────────────────────────────────────────────
function addRecord() {
    const banner     = document.getElementById('bannerName').value.trim();
    const main       = document.querySelector('input[name="mainPool"]:checked').value;
    const sub        = document.querySelector('input[name="subPool"]:checked').value;
    const pulledLead = document.querySelector('input[name="pulledLead"]:checked').value;
    const card       = document.getElementById('cardName').value.trim();
    const pulls      = parseInt(document.getElementById('pulls').value);

    if (!banner)                                 return alert('請輸入卡池名稱！');
    if (isNaN(pulls) || pulls < 1 || pulls > 70) return alert('請輸入 1-70 抽！');

    const event    = findEvent(banner, main);
    const isUpCard = !!(event && card && event.cards[pulledLead]?.includes(card));
    const oshis    = JSON.parse(localStorage.getItem('oshis')) || [];

    // 判斷抽卡結果類型
    let judgeResult;
    if (main === '常駐') {
        judgeResult = 'std';
    } else {
        judgeResult = isUpCard
            ? (sub === '混池' && oshis.length > 0 && !oshis.includes(pulledLead) ? 'wai_lim' : 'target')
            : 'wai_std';
    }

    const poolKey  = main === '限定' ? 'lim' : (main === '復刻' ? 're' : 'std');
    const currentP = getP(poolKey);

    // 取得卡池的預設時間；常駐池無活動時間，改用當下系統時間
    const eventTime  = getEventDate(banner, main);
    // OCR 有辨識到截圖上的真實許願時間時，優先使用 OCR 時間
    const ocrTime = Number(window.currentOCRTime);
    const recordTime =
        Number.isFinite(ocrTime) && ocrTime > 0
        ? ocrTime
        : (eventTime || Date.now());

    // 【Bug 修正】id 改用 nextId()（單調遞增計數器），
    //   避免同一毫秒內連續新增時產生相同 id 導致刪除/拖曳錯亂
    const rec = { id: nextId(), time: recordTime, main, sub, lead: pulledLead, banner, card, pulls, res: judgeResult };

    if (judgeResult === 'target' || judgeResult === 'std') {
        // 出目標卡或常駐五星：累計本次墊抽與輸入抽數作為總抽數
        rec.total = currentP + pulls;
        // 重設墊抽數為 OCR 偵測到的出金後已墊數（通常為 0）
        _setP(poolKey, window.currentPendingPulls);
    } else {
        // 歪卡：本次抽數不計入大保底累計，但墊抽繼續累加
        rec.total = pulls;
        _setP(poolKey, currentP + pulls);
    }

    window.currentPendingPulls = 0;
    const db = getDB();
    db.push(rec);
    setDB(db);
    
    // 本筆 OCR 時間已使用完畢，避免下一筆手動登錄沿用
    window.currentOCRTime = null;

    // 清空輸入欄位，準備下一筆
    document.getElementById('cardName').value = '';
    document.getElementById('pulls').value    = '';
    renderUI();
}

// ── 刪除紀錄 ───────────────────────────────────────────────
function deleteRec(id) {
    const db  = getDB();
    const rec = db.find(r => r.id === id);
    if (!rec) return;

    if (confirm(
        `確定刪除 ${rec.card} (${rec.pulls}抽) 嗎？\n\n` +
        `⚠️ 注意：系統不會自動扣除右上角的「已墊抽數」。\n` +
        `如果您要重新輸入這筆資料，請務必手動點擊右上角 ✏️，將墊抽數字改回正確的狀態（或歸零），否則抽數會被重複疊加！`
    )) {
        setDB(db.filter(r => r.id !== id));
        renderUI();
    }
}

// ── 清空紀錄 ───────────────────────────────────────────────
function clearAll() {
    const filterSelect = document.getElementById('recordFilterSelect');
    const filterVal    = filterSelect ? filterSelect.value : '全部';
    const msg = filterVal === '全部'
        ? '確定清空【所有】抽卡資料？'
        : `確定清空【${filterVal}池】的所有資料？`;

    if (confirm(msg)) {
        if (filterVal === '全部') {
            localStorage.removeItem('db_v4');
            _setP('lim', 0);
            _setP('re',  0);
            _setP('std', 0);
            window.currentPendingPulls = 0;
        } else {
            setDB(getDB().filter(r => r.main !== filterVal));
            if (filterVal === '限定') _setP('lim', 0);
            if (filterVal === '復刻') _setP('re',  0);
            if (filterVal === '常駐') _setP('std', 0);
        }
        renderUI();
    }
}

// ── 手動拖曳排序功能 ───────────────────────────────────────
let draggedRecordId = null;

function handleDragStart(event, id) {
    draggedRecordId = id;
    event.dataTransfer.effectAllowed = 'move';
    // 讓被拖曳的卡片變半透明以提示使用者
    setTimeout(() => { event.target.style.opacity = '0.5'; }, 0);
}

function handleDragOver(event) {
    // 必須取消預設行為，才能允許元素被放下 (Drop)
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const card = event.target.closest('.h-record-card');
    if (card && !card.classList.contains('drag-over')) {
        card.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    const card = event.target.closest('.h-record-card');
    if (card) card.classList.remove('drag-over');
}

function handleDragEnd(event) {
    // 拖曳結束：恢復透明度並清除所有高亮框
    event.target.style.opacity = '1';
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function handleDrop(event, targetId) {
    event.preventDefault();
    const card = event.target.closest('.h-record-card');
    if (card) card.classList.remove('drag-over');

    // 放到自己身上或無來源 ID 時不做任何事
    if (!draggedRecordId || draggedRecordId === targetId) return;

    const db = getDB();
    const draggedRecord = db.find(r => r.id === draggedRecordId);
    const targetRecord  = db.find(r => r.id === targetId);

    if (draggedRecord && targetRecord) {
        // 交換兩筆紀錄的時間戳記，藉此改變渲染時的排列順序。
        // 【Bug 修正】原本 fallback 使用 r._evTime，但 setDB() 在儲存時
        //   已透過 destructuring 將 _evTime 剔除，讀回後該欄位永遠是
        //   undefined。addRecord() 保證 rec.time 必有值（eventTime 或
        //   Date.now()），因此 fallback 只需保留 r.id 即可。
        const tempTime      = draggedRecord.time || draggedRecord.id;
        draggedRecord.time  = targetRecord.time  || targetRecord.id;
        targetRecord.time   = tempTime;

        setDB(db);
        renderUI();
    }

    draggedRecordId = null;
}
