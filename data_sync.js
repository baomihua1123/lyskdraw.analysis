// data_sync.js

function exportData() {
    // 1. 把所有需要的資料從 localStorage 抓出來打包成一個物件
    const data = {
        db_v4: JSON.parse(localStorage.getItem('db_v4')) || [],
        p_lim: localStorage.getItem('p_lim') || "0",
        p_re: localStorage.getItem('p_re') || "0",
        p_std: localStorage.getItem('p_std') || "0",
        oshis: JSON.parse(localStorage.getItem('oshis')) || []
    };

    // 2. 將物件轉換成 JSON 格式的字串 (null, 2 代表讓文字有縮排，方便人類閱讀)
    const dataStr = JSON.stringify(data, null, 2);

    // 3. 建立一個虛擬檔案 (Blob)
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // 4. 創造一個隱形的 <a> 連結並自動點擊它來觸發下載
    const a = document.createElement('a');
    a.href = url;
    // 檔名加上今天的日期
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `lysk_records_${dateStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    
    // 5. 下載完畢後清理掉剛才創造的虛擬連結
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    // 1. 取得使用者選擇的檔案
    const file = event.target.files[0];
    if (!file) return;

    // 2. 建立檔案讀取器
    const reader = new FileReader();
    
    // 3. 設定讀取完成後要執行的動作
    reader.onload = function(e) {
        try {
            // 將文字還原成資料物件
            const data = JSON.parse(e.target.result);
            
            // 寫回 localStorage
            if (data.db_v4) localStorage.setItem('db_v4', JSON.stringify(data.db_v4));
            if (data.p_lim) localStorage.setItem('p_lim', data.p_lim);
            if (data.p_re) localStorage.setItem('p_re', data.p_re);
            if (data.p_std) localStorage.setItem('p_std', data.p_std);
            if (data.oshis) localStorage.setItem('oshis', JSON.stringify(data.oshis));

            alert("✅ 資料匯入成功！");
            
            // 呼叫現有的函式來更新畫面
            if (typeof loadOshis === 'function') loadOshis();
            if (typeof renderUI === 'function') {
                window.currentPage = 1;
                renderUI();
            }
            
            // 清空 input 的值，確保下次上傳同一個檔案也能觸發 onchange
            event.target.value = '';
        } catch (err) {
            alert("❌ 匯入失敗，檔案格式可能錯誤：" + err.message);
        }
    };
    
    // 4. 開始以純文字模式讀取檔案
    reader.readAsText(file);
}
