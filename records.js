// ════════════════════════════════════════════════════════════
//  records.js — 紀錄增刪改、幸運判定、統計面板
// ════════════════════════════════════════════════════════════

// ── 幸運判定（單次）─────────────────────────────────────────
const judgeS = (p) =>
    p <= 16 ? { t: '天選之子 ✨', c: '#16a34a'} :
    p <= 40 ? { t: '幸運兒 🌟',  c: '#4ade80'} :
    p <= 61 ? { t: '平凡人 😐',  c: '#facc15'} :
    p <= 65 ? { t: '小不幸運 🌧️', c: '#fb923c'} :
              { t: '小倒霉鬼 🌩️', c: '#dc2626'};

const judgeT = (p) =>
    p <= 30 ? { t: '天選之子 ✨', c: '#16a34a'} :
    p <= 62 ? { t: '幸運兒 🌟',  c: '#4ade80'} :
    p <= 65 ? { t: '平凡人 😐',  c: '#facc15'} :
    p <= 68 ? { t: '小不幸運 🌧️', c: '#fb923c'} :
              { t: '小倒霉鬼 🌩️', c: '#dc2626'};

// ── 四欄統計：幸運標籤 HTML ───────────────────────────────
//    移至 updateLuckStats 外部，避免每次呼叫都重建函式物件
function getLuckHtml(avgPulls, isTarget) {
    if (avgPulls === 0) return '<span style="color:var(--text-sub)">---</span>';

    let mainHtml = '';
    const pullCount    = Math.max(1, Math.min(140, Math.round(avgPulls)));
    const beatPercent  = (typeof beatPercentTable !== 'undefined') ? beatPercentTable[pullCount] : 0;

    if (isTarget) {
        if      (beatPercent >= 85)   mainHtml = '<span class="title-god">✨ 天選之子</span>';
        else if (beatPercent >= 63.5) mainHtml = '<span class="title-lucky">🌟 幸運兒</span>';
        else if (beatPercent >= 48)   mainHtml = '<span class="title-plain">😐 平凡人</span>';
        else if (beatPercent >= 32.5) mainHtml = '<span class="title-unlucky">🌧️ 小不幸運</span>';
        else                          mainHtml = '<span class="title-bad">🌩️ 小倒霉鬼</span>';
    } else {
        const p = avgPulls;
        if      (p <= 16) mainHtml = '<span class="title-god">✨ 天選之子</span>';
        else if (p <= 40) mainHtml = '<span class="title-lucky">🌟 幸運兒</span>';
        else if (p <= 61) mainHtml = '<span class="title-plain">😐 平凡人</span>';
        else if (p <= 65) mainHtml = '<span class="title-unlucky">🌧️ 小不幸運</span>';
        else              mainHtml = '<span class="title-bad">🌩️ 小倒霉鬼</span>';
    }

    const percentHtml = `<span style="display:block; font-size:11px; color:var(--text-sub); font-weight:normal; margin-top:3px;">超越 ${beatPercent}% 玩家</span>`;
    return mainHtml + percentHtml;
}

// ── 四欄統計面板 ──────────────────────────────────────────
function updateLuckStats(db = getDB()) {
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

        if (prefix === 'Std') {
            document.getElementById(`stat${prefix}Count`).innerText = total5Count;
            document.getElementById(`stat${prefix}Avg`).innerText   = avg > 0 ? avg.toFixed(1) : '0.0';
        } else {
            document.getElementById(`stat${prefix}Count`).innerText = `${targetCount}/${total5Count}`;
            document.getElementById(`stat${prefix}Avg`).innerText   = avg > 0 ? avg.toFixed(1) : '0.0';
        }
    }

    // 1. 限定池
    const dbLim     = db.filter(r => r.main === '限定');
    const limPulls  = dbLim.reduce((sum, r) => sum + r.pulls, 0);
    const limTargets = dbLim.filter(r => r.res === 'target');
    const limAvg    = limTargets.length > 0 ? limTargets.reduce((s, r) => s + r.total, 0) / limTargets.length : 0;
    populateCard('Lim', limPulls, limTargets.length, dbLim.length, limAvg, getLuckHtml(limAvg, true), true);

    // 2. 常駐池
    const dbStd  = db.filter(r => r.main === '常駐');
    const stdPulls = dbStd.reduce((sum, r) => sum + r.pulls, 0);
    const stdAvg = dbStd.length > 0 ? dbStd.reduce((s, r) => s + r.total, 0) / dbStd.length : 0;
    populateCard('Std', stdPulls, 0, dbStd.length, stdAvg, getLuckHtml(stdAvg, false), false);

    // 3. 復刻池
    const dbRe     = db.filter(r => r.main === '復刻');
    const rePulls  = dbRe.reduce((sum, r) => sum + r.pulls, 0);
    const reTargets = dbRe.filter(r => r.res === 'target');
    const reAvg    = reTargets.length > 0 ? reTargets.reduce((s, r) => s + r.total, 0) / reTargets.length : 0;
    populateCard('Re', rePulls, reTargets.length, dbRe.length, reAvg, getLuckHtml(reAvg, true), true);

    // 4. 自訂副池
    const subType   = document.getElementById('statSubPoolSelect').value;
    const dbSub     = db.filter(r => r.sub === subType && (r.main === '限定' || r.main === '復刻'));
    const subPulls  = dbSub.reduce((sum, r) => sum + r.pulls, 0);
    const subTargets = dbSub.filter(r => r.res === 'target');
    const subAvg    = subTargets.length > 0 ? subTargets.reduce((s, r) => s + r.total, 0) / subTargets.length : 0;
    populateCard('Sub', subPulls, subTargets.length, dbSub.length, subAvg, getLuckHtml(subAvg, true), true);
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
    const pullDate   = document.getElementById('pullDate').value; // 程式邏輯：讀取新增的日期欄位

    if (!banner)                              return alert('請輸入卡池名稱！');
    if (isNaN(pulls) || pulls < 1 || pulls > 70) return alert('請輸入 1-70 抽！');

    const event    = findEvent(banner, main);
    const isUpCard = !!(event && card && event.cards[pulledLead]?.includes(card));
    const oshis    = JSON.parse(localStorage.getItem('oshis')) || [];

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

    // 程式邏輯：如果有選日期，將其轉換為電腦看得懂的時間戳記；若未選，預設為「現在」
    const recordTime = pullDate ? new Date(pullDate).getTime() : Date.now();

    // 程式邏輯：把 time 屬性正式存入資料結構中
    const rec = { id: Date.now(), time: recordTime, main, sub, lead: pulledLead, banner, card, pulls, res: judgeResult };

    if (judgeResult === 'target' || judgeResult === 'std') {
        rec.total = currentP + pulls;
        _setP(poolKey, window.currentPendingPulls);
    } else {
        rec.total = pulls;
        _setP(poolKey, currentP + pulls);
    }

    window.currentPendingPulls = 0;
    const db = getDB();
    db.push(rec);
    setDB(db);
    
    // 清空輸入框狀態，準備下一次輸入
    document.getElementById('cardName').value = '';
    document.getElementById('pulls').value    = '';
    document.getElementById('pullDate').value = ''; 
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
    const msg = filterVal === '全部' ? '確定清空【所有】抽卡資料？' : `確定清空【${filterVal}池】的所有資料？`;

    if (confirm(msg)) {
        if (filterVal === '全部') {
            localStorage.removeItem('db_v4');
            _setP('lim', 0);
            _setP('re', 0);
            _setP('std', 0);
            window.currentPendingPulls = 0;
        } else {
            setDB(getDB().filter(r => r.main !== filterVal));
            if (filterVal === '限定') _setP('lim', 0);
            if (filterVal === '復刻') _setP('re', 0);
            if (filterVal === '常駐') _setP('std', 0);
        }
        renderUI();
    }
}
// ── 手動拖曳排序功能 ───────────────────────────────────────
let draggedRecordId = null;

function handleDragStart(event, id) {
    draggedRecordId = id;
    // 設定拖曳效果為移動
    event.dataTransfer.effectAllowed = "move";
    // 讓原本被拖拉的卡片變半透明
    setTimeout(() => {
        event.target.style.opacity = "0.5";
    }, 0);
}

function handleDragOver(event) {
    // 必須取消預設行為，才能允許元素被放下 (Drop)
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    
    // 尋找滑鼠目前碰到哪一張卡片
    const card = event.target.closest('.h-record-card');
    if (card && !card.classList.contains('drag-over')) {
        card.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    const card = event.target.closest('.h-record-card');
    if (card) {
        card.classList.remove('drag-over');
    }
}

function handleDragEnd(event) {
    // 拖曳結束時，把透明度恢復，並清空所有的虛線框
    event.target.style.opacity = "1";
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function handleDrop(event, targetId) {
    event.preventDefault();
    
    const card = event.target.closest('.h-record-card');
    if (card) {
        card.classList.remove('drag-over');
    }

    // 如果沒有抓到ID，或是自己放到自己身上，就不做事
    if (!draggedRecordId || draggedRecordId === targetId) return;

    const db = getDB();
    
    // 在資料庫中尋找被抓起的紀錄，以及被放下的目標紀錄
    const draggedRecord = db.find(r => r.id === draggedRecordId);
    const targetRecord = db.find(r => r.id === targetId);

    if (draggedRecord && targetRecord) {
        // C++ 中的 Swap 概念：交換兩者的時間戳記，藉此改變渲染時的排列順序
        const tempTime = draggedRecord.time || draggedRecord._evTime || draggedRecord.id;
        draggedRecord.time = targetRecord.time || targetRecord._evTime || targetRecord.id;
        targetRecord.time = tempTime;

        // 存檔並重新渲染畫面
        setDB(db);
        renderUI();
    }
    
    draggedRecordId = null;
}
