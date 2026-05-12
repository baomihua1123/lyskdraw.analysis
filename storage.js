// ════════════════════════════════════════════════════════════
//  storage.js — LocalStorage 存取、全域常數與資料遷移
// ════════════════════════════════════════════════════════════

// ── 男主角圖示對照表 ───────────────────────────────────────
const leadIcons = { '祁煜': '🐟', '沈星回': '🌟', '黎深': '🍐', '秦徹': '🚘', '夏以晝': '🍎' };

// ── 全域暫存：OCR 解析出的出金後已墊抽數 ──────────────────
window.currentPendingPulls = 0;

// ── 唯一 ID 產生器 ─────────────────────────────────────────
//    【Bug 修正】原本使用 Date.now() 作為紀錄 ID，若使用者在
//    同一毫秒內連續新增（或 OCR 批次寫入），會產生重複 ID，
//    導致刪除、拖曳排序出錯。改用單調遞增計數器確保唯一性。
//    初始值以 Date.now() 起跳，避免與舊有紀錄的 ID 衝突。
let _recIdCounter = Date.now();
const nextId = () => ++_recIdCounter;

// ── DB CRUD ────────────────────────────────────────────────
//    getDB：從 localStorage 讀取資料庫（預設回傳空陣列）
//    setDB：儲存前先剔除所有執行期間暫算欄位（_前綴 及 luck），
//           以節省 localStorage 空間並避免狀態汙染
const getDB = () => JSON.parse(localStorage.getItem('db_v4')) || [];

const setDB = (db) => {
    // 使用 destructuring 移除不需要持久化的計算欄位
    const toSave = db.map(({ _evTime, _sortTime, _entryOrder, luck, ...rest }) => rest);
    localStorage.setItem('db_v4', JSON.stringify(toSave));
};

// ── 墊抽數存取 ─────────────────────────────────────────────
//    getP  ：讀取指定池的已墊抽數
//    _setP ：只寫入，不觸發畫面更新（內部使用）
//    setP  ：寫入並立即重新渲染（對外使用）
const getP  = (type) => parseInt(localStorage.getItem('p_' + type)) || 0;
const _setP = (type, v) => localStorage.setItem('p_' + type, v);
const setP  = (type, v) => { _setP(type, v); renderUI(); };

// ── 錯字自動更正字典 ──────────────────────────────────────
//    日後若發現系統層級的錯字或卡池改名，只需在此加入對照即可，
//    migrateDB() 會在下次啟動時自動套用。
const TYPO_CORRECTIONS = {
    '極空迴音':   '極空迴響',
    '今日無處可選': '今日無處可逃',
};

// ── 一次性資料遷移 ─────────────────────────────────────────
//    在每次應用程式啟動時執行，確保舊版資料格式正確轉換。
//    只有資料實際發生變動時才寫回 localStorage，避免無謂 I/O。
function migrateDB() {
    const db = getDB();
    let changed = false;

    db.forEach(r => {
        // 修正舊版的歪卡標籤（'oshi_spook' → 'wai_std'）
        if (r.res === 'oshi_spook') {
            r.res = 'wai_std';
            changed = true;
        }

        // 自動比對字典並替換卡池名稱（錯字修正）
        if (r.banner && TYPO_CORRECTIONS[r.banner]) {
            r.banner = TYPO_CORRECTIONS[r.banner];
            changed = true;
        }

        // 自動比對字典並替換卡片名稱（錯字修正）
        if (r.card && TYPO_CORRECTIONS[r.card]) {
            r.card = TYPO_CORRECTIONS[r.card];
            changed = true;
        }
    });

    if (changed) setDB(db);
}
