// ════════════════════════════════════════════════════════════
//  render.js — 主題、主推設定、主渲染函式與初始化
// ════════════════════════════════════════════════════════════

// 初始化當前頁數
window.currentPage = 1;

// 切換頁數的函式 (傳入 1 代表下一頁，-1 代表上一頁)
window.changePage = function(delta) {
    window.currentPage += delta;
    renderUI();
};

// ── 主題 ──────────────────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = saved;
    document.getElementById('themeBtn').textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    document.getElementById('themeBtn').textContent = next === 'dark' ? '☀️' : '🌙';
}

// ── 主推設定 ──────────────────────────────────────────────
function toggleOshiEdit() {
    const group    = document.getElementById('oshiGroup');
    const btn      = document.getElementById('oshiToggleBtn');
    const isHidden = group.style.display === 'none';
    group.style.display = isHidden ? 'flex' : 'none';
    btn.innerText = isHidden ? '[收起]' : '[設定]';
}

function updateOshiSummary() {
    const oshis = JSON.parse(localStorage.getItem('oshis')) || [];
    document.getElementById('oshiSummary').innerHTML = oshis.length > 0
        ? `💖 主推守護中：${oshis.map(name => leadIcons[name] || '').join('')}`
        : `💖 尚未設定主推`;
}

function saveOshis() {
    const oshis = Array.from(document.querySelectorAll('input[name="oshi"]:checked')).map(cb => cb.value);
    localStorage.setItem('oshis', JSON.stringify(oshis));
    updateOshiSummary();
    renderUI();
}

function loadOshis() {
    const oshis = JSON.parse(localStorage.getItem('oshis')) || [];
    document.querySelectorAll('input[name="oshi"]').forEach(cb => {
        cb.checked = oshis.includes(cb.value);
    });
    updateOshiSummary();
}
// ── 主渲染函式 ─────────────────────────────────────────────
function renderUI() {
    document.getElementById('pLim').innerText = 140 - getP('lim');
    document.getElementById('pRe').innerText  = 140 - getP('re');
    document.getElementById('pStd').innerText =  70 - getP('std');

    const db    = getDB();
    const oshis = JSON.parse(localStorage.getItem('oshis')) || [];

    let dbChanged = false;
    db.forEach(r => {
        if (r.card && r.card !== '未知' && r.main !== '常駐') {
            const trueLead = findTrueLead(r.card);
            if (trueLead) {
                if (r.lead !== trueLead) { r.lead = trueLead; dbChanged = true; }
                const event    = findEvent(r.banner, r.main);
                const isUpCard = event?.cards[trueLead]?.includes(r.card);
                const newRes   = isUpCard
                    ? (r.sub === '混池' && oshis.length > 0 && !oshis.includes(trueLead) ? 'wai_lim' : 'target')
                    : 'wai_std';
                if (r.res !== newRes) { r.res = newRes; dbChanged = true; }
            }
        }
        const evTime      = getEventDate(r.banner, r.main);
        r._evTime         = evTime;
        // 程式邏輯：這行最關鍵！排序依據優先看自訂時間(r.time)，再來是活動時間，最後才是建立ID
        r._sortTime       = r.time || evTime || r.id; 
        r._entryOrder     = r.id;

        if      (r.res === 'target') r.luck = judgeT(r.total);
        else if (r.main === '常駐')  r.luck = judgeS(r.total);
        else                         r.luck = judgeS(r.pulls);
    });

    if (dbChanged) setDB(db);

    // 程式邏輯：執行從大到小(由新到舊)的排序
    db.sort((a, b) => b._sortTime - a._sortTime || b._entryOrder - a._entryOrder);

    updateLuckStats(db);

    let peakHTML = '';
    if (db.length > 0) {
        const targets = db.filter(r => r.res === 'target');
        if (targets.length > 0) {
            const best = [...targets].sort((a, b) => a.total - b.total)[0];
            peakHTML += `<div class="peak-item"><span class="peak-label-best">🏆 巔峰紀錄:</span> <span>${
                best.lead ? (oshis.includes(best.lead) ? '💖' : '') + (leadIcons[best.lead] || '') + best.lead : ''
            } ${best.banner} (${best.total}抽)</span></div>`;
        }
        const waiR = db.filter(r => ['wai_std', 'wai_lim', 'wai'].includes(r.res));
        if (waiR.length > 0) {
            const counts = {};
            waiR.forEach(r => counts[r.lead] = (counts[r.lead] || 0) + 1);
            let maxC = 0, maxL = [];
            for (const l in counts) {
                if      (counts[l] > maxC) { maxC = counts[l]; maxL = [l]; }
                else if (counts[l] === maxC) maxL.push(l);
            }
            peakHTML += `<div class="peak-item" style="margin-top:4px;"><span class="peak-label-spook">💔 歪卡常客:</span> <span>${
                maxL.map(l => (leadIcons[l] || '') + l).join('、')
            } (${maxC}次)</span></div>`;
        }
    }
    document.getElementById('peakBoard').innerHTML =
        peakHTML || '<div style="text-align:center;font-size:12px;color:var(--text-sub)">尚無資料</div>';

    const filterSelect = document.getElementById('recordFilterSelect');
    const filterVal    = filterSelect ? filterSelect.value : '全部';
    const displayDb    = filterVal !== '全部' ? db.filter(r => r.main === filterVal) : db;

    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(displayDb.length / itemsPerPage));
    
    if (window.currentPage > totalPages) {
        window.currentPage = totalPages;
    } else if (window.currentPage < 1) {
        window.currentPage = 1;
    }

    const startIndex = (window.currentPage - 1) * itemsPerPage;
    const paginatedDb = displayDb.slice(startIndex, startIndex + itemsPerPage);

    document.getElementById('recordList').innerHTML = paginatedDb.map(r => {
        let cardTypeStr, statusColor;
        if      (r.main === '常駐')   { cardTypeStr = '🎫 常駐'; statusColor = '#3b82f6'; }
        else if (r.res === 'target')  { cardTypeStr = '🎯 限定'; statusColor = 'var(--primary)'; }
        else if (r.res === 'wai_lim') { cardTypeStr = '💔 限定'; statusColor = '#ef4444'; }
        else                          { cardTypeStr = '☠️ 歪卡'; statusColor = '#475569'; }

        // 程式邏輯：將卡片上的日期精確顯示到「年/月/日」
        const d       = new Date(r.time || r._evTime || r.id);
        const dateStr = r.main === '常駐' && !r.time
            ? ''
            : `[${d.getFullYear().toString().slice(2)}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}]`;

        const isBlack    = r.pulls > 55 && r.pulls <= 62;
        const subTagHtml = r.main !== '常駐' ? `<span class="tag tag-lim">${r.sub}</span>` : '';

        return `
        <div class="h-record-card">
            <div class="h-bar-bg" style="width: ${Math.min((r.pulls / 70) * 100, 100)}%; background-color: ${r.luck.c};"></div>
            <div class="h-content">
                <div class="h-left">
                    <div class="h-tags">${r.main === '復刻' ? '<span class="tag tag-re">復刻</span>' : ''}${subTagHtml}<span class="tag" style="background-color: ${statusColor};">${cardTypeStr}</span></div>
                    <span class="h-title">
                        <span style="font-size: 15px; font-weight: bold; color: var(--text-main);">${r.card || '未知'}</span>
                        <span style="font-size: 12px; font-weight: normal;"> | ${r.banner}</span>
                        <span class="h-date">${dateStr}</span>
                    </span>
                </div>
                <div class="h-right">
                    <div class="h-pulls"><span class="pull-num">${r.pulls}</span> 抽</div>
                    <div class="h-luck ${r.pulls > 55 ? 'luck-high' : ''} ${isBlack ? 'luck-black-light' : ''}" style="${r.pulls <= 55 ? 'background-color:' + r.luck.c + 'BF;color:#fff;' : ''}">${r.luck.t}</div>
                    <button class="del-btn-icon" onclick="deleteRec(${r.id})">🗑️</button>
                </div>
            </div>
        </div>`;
    }).join('');

    const paginationEl = document.getElementById('paginationControls');
    if (paginationEl) {
        if (displayDb.length > itemsPerPage) {
            paginationEl.innerHTML = `
                <button class="page-btn" onclick="changePage(-1)" ${window.currentPage === 1 ? 'disabled' : ''}>◀ 上一頁</button>
                <span class="page-info">第 ${window.currentPage} / ${totalPages} 頁</span>
                <button class="page-btn" onclick="changePage(1)" ${window.currentPage === totalPages ? 'disabled' : ''}>下一頁 ▶</button>
            `;
        } else {
            paginationEl.innerHTML = '';
        }
    }
}
// ── 啟動 ───────────────────────────────────────────────────
migrateDB();
initTheme();
loadOshis();
updateBannerRecommendations();
renderUI();
