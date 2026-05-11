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

// ── 一次性資料遷移 ─────────────────────────────────────────
function migrateDB() {
    const db = getDB();
    let changed = false;
    
    db.forEach(r => {
        if (r.res === 'oshi_spook') { 
            r.res = 'wai_std'; 
            changed = true; 
        }
        
        // 👇 新增：錯字修正邏輯 (請將下方單引號內的文字換成你實際打錯的字)
        
        // 1. 如果是「卡名」有錯字：
        if (r.card === '這裡填舊的錯誤卡名') { 
            r.card = '這裡填正確的卡名'; 
            changed = true; 
        }
        
        // 2. 如果是「卡池名稱」有錯字：
        if (r.banner === '這裡填舊的錯誤卡池名') { 
            r.banner = '這裡填正確的卡池名'; 
            changed = true; 
        }
    });
    
    // 如果有發現錯字並進行了修改，就把更新後的資料存回資料庫
    if (changed) setDB(db);
}
