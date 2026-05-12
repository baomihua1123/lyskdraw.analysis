// ════════════════════════════════════════════════════════════
//  data_sync.js — 資料匯出 / 匯入
// ════════════════════════════════════════════════════════════

// ── 池別 localStorage Key 清單 ────────────────────────────
//    【精簡】原本 exportData / importData 各自硬寫 p_lim / p_re / p_std，
//    若日後新增池別（如日卡池獨立保底），只需在此加一行，
//    兩個函式會自動同步，不會漏改。
const POOL_KEYS = ['lim', 're', 'std'];

// ── 匯出 ─────────────────────────────────────────────────
function exportData() {
    // 1. 從 localStorage 抓出所有需要備份的資料並打包成物件
    const pendingData = Object.fromEntries(
        POOL_KEYS.map(k => [`p_${k}`, localStorage.getItem(`p_${k}`) || '0'])
    );
    const data = {
        db_v4: JSON.parse(localStorage.getItem('db_v4')) || [],
        ...pendingData,
        oshis: JSON.parse(localStorage.getItem('oshis')) || []
    };

    // 2. 序列化為易讀的 JSON 格式（縮排 2 格）
    const dataStr = JSON.stringify(data, null, 2);

    // 3. 建立虛擬 Blob 檔案並自動觸發下載
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    // 檔名包含今天的日期，方便使用者辨識備份版本
    a.download = `lysk_records_${new Date().toISOString().slice(0, 10)}.json`;

    document.body.appendChild(a);
    a.click();

    // 4. 下載完畢後清理虛擬連結，防止記憶體洩漏
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── 匯入 ─────────────────────────────────────────────────
function importData(event) {
    // 1. 取得使用者選擇的檔案
    const file = event.target.files[0];
    if (!file) return;

    // 2. 建立檔案讀取器
    const reader = new FileReader();

    // 3. 讀取完成後還原資料
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // 還原抽卡紀錄
            if (data.db_v4) localStorage.setItem('db_v4', JSON.stringify(data.db_v4));

            // 【精簡】依 POOL_KEYS 批次還原各池墊抽數，不再逐一硬寫
            POOL_KEYS.forEach(k => {
                const val = data[`p_${k}`];
                // 使用 != null 同時防衛 null 與 undefined，但允許 "0"
                if (val != null) localStorage.setItem(`p_${k}`, val);
            });

            // 還原主推設定
            if (data.oshis) localStorage.setItem('oshis', JSON.stringify(data.oshis));

            alert('✅ 資料匯入成功！');

            // 更新畫面
            if (typeof loadOshis === 'function') loadOshis();
            if (typeof renderUI  === 'function') {
                window.currentPage = 1;
                renderUI();
            }

            // 清空 input 值，確保下次上傳相同檔案也能觸發 onchange
            event.target.value = '';
        } catch (err) {
            alert('❌ 匯入失敗，檔案格式可能錯誤：' + err.message);
        }
    };

    // 4. 以純文字模式讀取 JSON 檔案
    reader.readAsText(file);
}
