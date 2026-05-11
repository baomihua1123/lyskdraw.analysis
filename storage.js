// ════════════════════════════════════════════════════════════
//  storage.js — LocalStorage 存取、全域常數與資料遷移
// ════════════════════════════════════════════════════════════

const leadIcons = { '祁煜': '🐟', '沈星回': '🌟', '黎深': '🍐', '秦徹': '🚘', '夏以晝': '🍎' };

window.currentPendingPulls = 0;

// ── DB CRUD ───────────────────────────────────────────────
const getDB = () => JSON.parse(localStorage.getItem('db_v4')) || [];

const setDB = (db) => {
    const toSave = db.map(({ _evTime, _sortTime, _entryOrder, luck, ...rest }) => rest);
    localStorage.setItem('db_v4', JSON.stringify(toSave));
};

// ── 墊抽數存取 ─────────────────────────────────────────────
const getP  = (type) => parseInt(localStorage.getItem('p_' + type)) || 0;
const _setP = (type, v) => localStorage.setItem('p_' + type, v);
const setP  = (type, v) => { _setP(type, v); renderUI(); };

// ── 錯字自動更正字典 ─────────────────────────────────────
// 以後如果發現系統層級的錯字，只要在這裡加一行對照表就好
const TYPO_CORRECTIONS = {
    '極空迴音': '極空迴響',
    '今日無處可選': '今日無處可逃',
};

// ── 一次性資料遷移 ─────────────────────────────────────────
function migrateDB() {
    const db = getDB();
    let changed = false;
    
    db.forEach(r => {
        // 修正舊版的歪卡標籤
        if (r.res === 'oshi_spook') { 
            r.res = 'wai_std'; 
            changed = true; 
        }
        
        // 自動比對字典並替換卡池名稱
        if (r.banner && TYPO_CORRECTIONS[r.banner]) { 
            r.banner = TYPO_CORRECTIONS[r.banner]; 
            changed = true; 
        }
        
        // 自動比對字典並替換卡片名稱
        if (r.card && TYPO_CORRECTIONS[r.card]) { 
            r.card = TYPO_CORRECTIONS[r.card]; 
            changed = true; 
        }
    });
    
    if (changed) setDB(db);
}
