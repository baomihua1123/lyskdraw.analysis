// ═══════════════════════════════════════════════════════════
//  ocr_parser.js — 智慧行合併 + 特徵防丟失版 (v26 重構優化版)
// ═══════════════════════════════════════════════════════════

// ── 常數：異體字對照表（移至頂端，確保解析時可用）──────────
const VARIANT_CHARS = { '溫': '温', '繾': '缱', '綣': '绻', '晝': '昼', '跡': '迹', '戀': '恋' };

// ── 男主角名稱清單 ─────────────────────────────────────────
//    【精簡】原本在 parseOCRLines 中硬寫了 3 次相同的陣列，
//    現改為從 standardCards 的 key 動態取得，新增男主時只需
//    更新 love_and_deepspace_standard.js，此處自動跟進。
//    注意：standardCards 在此腳本之前載入（見 index.html 順序），
//    但仍加 typeof 防衛，以利單元測試或獨立引用。
const LEADS = typeof standardCards !== 'undefined' ? Object.keys(standardCards) : [];

// ── 快取：從靜態資料一次性建立已知卡名清單 ─────────────────
//    standardCards / eventCards 在此 script 之前已載入。
//    建立後整個執行期間不再重建，避免每次 OCR 都重新迭代。
const KNOWN_CARDS = (() => {
    const cards = [];
    if (typeof standardCards !== 'undefined')
        cards.push(...Object.values(standardCards).flat());
    if (typeof eventCards !== 'undefined')
        eventCards.forEach(e => cards.push(...Object.values(e.cards).flat()));
    return [...new Set(cards)];
})();

// ── handleOCR ────────────────────────────────────────────
//    OCR 診斷版
//    功能與原本相同，但會額外檢查：
//    「OCR文字星級」與「顏色星級」是否發生衝突。

async function handleOCR(event) {
    const inputEl = event.target;
    const files = inputEl.files;

    if (!files || files.length === 0) return;

    const statusEl = document.getElementById('ocrStatus');

    statusEl.innerText = `⏳ 辨識中... (0/${files.length})`;
    statusEl.style.color = '#c084fc';

    try {
        let pages = [];
        let warnings = [];

        for (let i = 0; i < files.length; i++) {
            statusEl.innerText =
                `⏳ 辨識中... (${i + 1}/${files.length})`;

            const records =
                await extractRecordsFromImage(files[i]);

            // 記錄這些 OCR 紀錄來自第幾張圖片
            records.forEach(record => {
                record._ocrPage = i + 1;
            });

            if (records.length < 5) {
                warnings.push(
                    `第 ${i + 1} 張僅讀取到 ${records.length} 筆`
                );
            }

            if (records.length > 0) {

                // 找出本頁有真實時間戳記的紀錄，
                // 作為頁面排序依據
                const validTimeRecord =
                    records.find(r => r._hasRealTime);

                records._pageTime =
                    validTimeRecord
                        ? validTimeRecord.time
                        : 0;

                pages.push(records);
            }
        }

        if (pages.length === 0) {
            statusEl.innerText =
                '⚠️ 未能辨識，請確認截圖清晰';

            statusEl.style.color = '#facc15';
            return;
        }

        // ── 依頁面時間由新到舊排序 ────────────────────────
        pages.sort(
            (a, b) => b._pageTime - a._pageTime
        );

        // 攤平成一維陣列
        const allRecords = pages.flat();

        // ── 星級診斷統計 ───────────────────────────────────
        const starConflicts = allRecords.filter(
            r => r._starDebug?.conflict
        );

        // 將診斷結果寫入 console，
        // 方便之後需要進一步分析時查看
        if (starConflicts.length > 0) {
            console.group(
                '🔍 OCR 星級判定診斷'
            );

            console.table(
                starConflicts.map(r => ({
                    圖片: r._ocrPage,
                    卡名: r.name,
                    原始文字: r.raw,
                    OCR文字星級:
                        r._starDebug.textStar,
                    顏色判定星級:
                        r._starDebug.colorStar,
                    最終判定:
                        r._starDebug.finalStar
                }))
            );

            console.groupEnd();
        }

        const result = countPulls(allRecords);

        if (result.pullEvents.length > 0) {

            // 保留舊資料優先邏輯：
            // 多張五星時從最舊的一筆開始補登
            const targetGold =
                result.pullEvents[
                    result.pullEvents.length - 1
                ];

            const pendingPulls =
                result.pendingPulls;

            let finalPoolName = null;

            // 輔助：判斷卡名是否為常駐池卡片
            const isStandard = (name) => {
                if (
                    !name ||
                    typeof standardCards === 'undefined'
                ) {
                    return false;
                }

                return Object.values(standardCards)
                    .some(list => list.includes(name));
            };

            // 連續兩次五星皆為常駐卡
            // → 判定為常駐池
            if (
                isStandard(targetGold.name) &&
                isStandard(targetGold.prevName)
            ) {
                finalPoolName = '常駐';
            }

            if (
                typeof window.autoFillFromOCR === 'function'
            ) {
                window.autoFillFromOCR(
                    targetGold.pulls,
                    targetGold.name,
                    targetGold.time,
                    pendingPulls,
                    targetGold.raw,
                    finalPoolName
                );
            }

            // ── 建立原本的結果通知 ────────────────────────
            let resText = `✅ 辨識完成！`;

            if (finalPoolName) {
                resText += `（${finalPoolName}）`;
            }

            resText += `\n\n`;

            [...result.pullEvents]
                .reverse()
                .forEach(evt => {
                    resText +=
                        `${evt.name}：${evt.pulls} 抽\n`;
                });

            if (pendingPulls > 0) {
                resText +=
                    `\n💡 偵測到出金後已墊 ${pendingPulls} 抽`;
            }

            // ── 加入星級判定衝突資訊 ──────────────────────
            if (starConflicts.length > 0) {

                resText +=
                    `\n\n⚠️ 發現 ${starConflicts.length} 筆星級判定差異：`;

                // 最多顯示 10 筆，避免通知過長
                starConflicts
                    .slice(0, 10)
                    .forEach(r => {

                        resText +=
    `\n第${r._ocrPage}張｜${r.name}`;

resText +=
    `｜文字${r._starDebug.textStar}星`;

resText +=
    `｜顏色${r._starDebug.colorStar}星`;

resText +=
    `｜採用${r._starDebug.finalStar}星`;

resText +=
    `｜金${(r._starDebug.goldRatio * 100).toFixed(3)}%`;

resText +=
    `｜紫${(r._starDebug.purpleRatio * 100).toFixed(3)}%`;
                    });

                if (starConflicts.length > 10) {
                    resText +=
                        `\n……其餘 ${starConflicts.length - 10} 筆請查看 Console`;
                }
            }

            if (warnings.length > 0) {
                resText +=
                    `\n(⚠️ ${warnings.join('；')})`;
            }

            statusEl.innerText = resText;
            statusEl.style.color = '#4ade80';

        } else {

            let warningText =
                `⚠️ 只找到 ${result.fiveStarCount} 個5星 ` +
                `(需至少2個才能計算，請確認截圖範圍)`;

            // 即使五星不足，也要顯示星級衝突
            if (starConflicts.length > 0) {

                warningText +=
                    `\n\n⚠️ 發現 ${starConflicts.length} 筆星級判定差異：`;

                starConflicts
                    .slice(0, 10)
                    .forEach(r => {

                        warningText +=
                            `\n第${r._ocrPage}張｜${r.name}`;

                        warningText +=
                            `｜文字${r._starDebug.textStar}星`;

                        warningText +=
                            `｜顏色${r._starDebug.colorStar}星`;

                        warningText +=
                            `｜採用${r._starDebug.finalStar}星`;
                    });
            }

            statusEl.innerText = warningText;
            statusEl.style.color = '#facc15';
        }

    } catch (err) {

        statusEl.innerText =
            '❌ 失敗：' +
            (err.message || '未知');

        statusEl.style.color = '#ef4444';

        console.error(
            'OCR Error:',
            err
        );
    }
}

// ── extractRecordsFromImage ───────────────────────────────
async function extractRecordsFromImage(file) {
    const colorCanvas = await fileToCanvas(file);
    const { width, height } = colorCanvas;

    // 裁切頂端 15%（通常是 UI 標題欄），降低 OCR 噪音
    const cropTop = Math.floor(height * 0.15);
    const ocrCanvas = document.createElement('canvas');
    ocrCanvas.width  = width;
    ocrCanvas.height = height - cropTop;
    const ctx = ocrCanvas.getContext('2d');
    // 灰階 + 反色 + 高對比，讓深色背景上的白字更易辨識
    ctx.filter = 'grayscale(100%) invert(100%) contrast(180%) brightness(110%)';
    ctx.drawImage(colorCanvas, 0, -cropTop);

    const result = await Tesseract.recognize(ocrCanvas, 'chi_tra+eng');

    // 將 Tesseract 的行結果，依 Y 軸重疊度合併成視覺上的「同一行」
    const rows = [];
    for (const line of result.data.lines) {
        const text = line.text.trim();
        if (text.length < 2) continue;

        // 找已有 row 中與此行 Y 軸重疊超過 30% 的（視為同一行）
        let foundRow = rows.find(r => {
            const overlap   = Math.max(0, Math.min(r.bbox.y1, line.bbox.y1) - Math.max(r.bbox.y0, line.bbox.y0));
            const minHeight = Math.min(r.bbox.y1 - r.bbox.y0, line.bbox.y1 - line.bbox.y0);
            return overlap > minHeight * 0.3;
        });

        if (foundRow) {
            // 依 X 座標決定文字左右拼接順序
            foundRow.text = line.bbox.x0 < foundRow.bbox.x0
                ? text + ' ' + foundRow.text
                : foundRow.text + ' ' + text;
            // 更新合併後的邊界框
            foundRow.bbox.x0 = Math.min(foundRow.bbox.x0, line.bbox.x0);
            foundRow.bbox.y0 = Math.min(foundRow.bbox.y0, line.bbox.y0);
            foundRow.bbox.x1 = Math.max(foundRow.bbox.x1, line.bbox.x1);
            foundRow.bbox.y1 = Math.max(foundRow.bbox.y1, line.bbox.y1);
            foundRow.yCenter = (foundRow.bbox.y0 + foundRow.bbox.y1) / 2;
        } else {
            const yCenter = (line.bbox.y0 + line.bbox.y1) / 2;
            rows.push({ text, yCenter, bbox: { ...line.bbox } });
        }
    }
    // 依垂直中心點由上到下排序
    rows.sort((a, b) => a.yCenter - b.yCenter);

    return parseOCRLines(rows, colorCanvas, cropTop);
}

// ── detectStarFromColor ───────────────────────────────────
//    分析指定行的像素顏色，判斷星級：
//    金色（橘紅主色）→ 5星
//    藍紫色 → 4星
//    其餘 → 3星
//
//    ⚠️ 診斷版：保留原本判定邏輯，不直接修改結果。
//    目的只是讓 parseOCRLines 同時取得顏色判定結果，
//    再與 OCR 文字判定結果進行比較。

function detectStarFromColor(colorCanvas, bbox, cropTop) {
    const y0 = Math.max(0, bbox.y0 + cropTop);
    const h  = bbox.y1 - bbox.y0;

    if (h <= 0) return null;

    const ctx = colorCanvas.getContext('2d');
    const data = ctx.getImageData(
        0,
        y0,
        colorCanvas.width,
        h
    ).data;

    let gCount = 0;
    let pCount = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 金色（目前 5 星判定條件）
        if (
            r > 140 &&
            r > g &&
            g > b &&
            (r - b) > 35
        ) {
            gCount++;
        }

        // 藍紫色（目前 4 星判定條件）
        else if (
            b > r &&
            b > g &&
            (b - r) > 25 &&
            b > 120
        ) {
            pCount++;
        }
    }

    const totalPixels = data.length / 4;

    if (totalPixels <= 0) return null;

    const goldRatio = gCount / totalPixels;
    const purpleRatio = pCount / totalPixels;

    let star;

    if (goldRatio > 0.003) {
        star = 5;
    } else if (purpleRatio > 0.003) {
        star = 4;
    } else {
        star = 3;
    }

    // 回傳完整診斷資訊
    return {
        star,
        goldRatio,
        purpleRatio,
        goldPixels: gCount,
        purplePixels: pCount,
        totalPixels,
        y0,
        height: h
    };
}

// ── parseOCRLines ─────────────────────────────────────────
//    使用模組頂端的 KNOWN_CARDS 快取，避免每次重建。
//    使用模組頂端的 LEADS 常數，避免硬寫男主名稱三次。
function parseOCRLines(rows, colorCanvas, cropTop) {
    const records = [];
    const known   = KNOWN_CARDS; // 直接引用快取，不再重建
    let lastTime  = Date.now();

    for (const row of rows) {
        const rawText = row.text.trim();

        // 跳過太短或明顯是 UI 標題文字的行
        if (
            rawText.length < 4 ||
            /DEEPSPACE|LIMITED|掉落|預覽|許願|記錄|伺服器|延遲|沒有資料|稍後|再來|UID|uid|類型|名稱|時間/i.test(rawText)
        ) continue;

        const textNoSpace = rawText.replace(/\s+/g, '');
        const cleanText   = textNoSpace.replace(/[345]星/g, '').replace(/\[Mini\]/ig, '');

        // 快速篩選：此行必須含有男主名、星級文字或日期之一，否則跳過
        const hasName    = LEADS.some(n => cleanText.includes(n));  // 【精簡】使用 LEADS 常數
        const hasStarStr = /[345]星/.test(textNoSpace);
        const hasDate    = /202\d/.test(rawText) || /-\d{2}-\d{2}/.test(rawText);
        if (!hasName && !hasStarStr && !hasDate) continue;

        // ── 星級雙重診斷 ──────────────────────────────────────────
        //    同時取得：
        //    1. OCR 文字判定
        //    2. 圖片顏色判定
        //    3. 最終實際採用的判定
        //
        //    ⚠️ 目前仍維持「顏色優先」的原本邏輯。
        //    此階段只用來找出兩種判定是否發生衝突。

        // ① OCR 文字判定
        let textStar = null;

        if (/5星/.test(textNoSpace)) {
            textStar = 5;
        } else if (/4星/.test(textNoSpace)) {
            textStar = 4;
        } else if (/3星/.test(textNoSpace)) {
            textStar = 3;
        }
        // ② 顏色判定
                const colorStar = detectStarFromColor(
                    colorCanvas,
                    row.bbox,
                    cropTop
                );

        // ③ 維持目前程式的「顏色優先」邏輯
        const star = colorStar ?? textStar ?? 3;

        // ④ 記錄兩種判定是否衝突
        const starConflict =
            textStar !== null &&
            colorStar !== null &&
            textStar !== colorStar;

        // ── 卡名比對（三段式，由精確到模糊）─────────────────
        let cardName = '未知';

        // 第一段：精確包含比對
        for (const k of known) {
            if (cleanText.includes(k.replace(/\s+/g, ''))) { cardName = k; break; }
        }

        // 第二段：模糊字元比對（異體字容錯，匹配率需 >= 50%）
        if (cardName === '未知') {
            let maxS = 0;
            for (const k of known) {
                const kChars = k.replace(/\s+/g, '').split('');
                let s = 0;
                kChars.forEach(c => {
                    if (cleanText.includes(c) || (VARIANT_CHARS[c] && cleanText.includes(VARIANT_CHARS[c]))) s++;
                });
                if (s / kChars.length >= 0.5 && s > maxS) { maxS = s; cardName = k; }
            }
        }

        // 第三段：從中文字元中找最長詞段（最後保底，結果可能不準確）
        if (cardName === '未知') {
            const m = cleanText.match(/[\u4e00-\u9fa5]{2,}/g);
            if (m) {
                // 【精簡】使用 LEADS 常數過濾掉男主名，保留其餘中文片段
                const leadsPattern = new RegExp(LEADS.join('|'), 'g');
                const f = m
                    .map(s => s.replace(leadsPattern, ''))
                    .filter(s => s.length >= 2 && !/^[星類型名稱時間掉落預覽]+$/.test(s));
                if (f.length > 0) cardName = f.reduce((a, b) => a.length >= b.length ? a : b);
            }
            // 若仍未知但可辨識男主，標記為「男主 (未知卡名)」
            const foundLead = LEADS.find(l => cleanText.includes(l));  // 【精簡】使用 LEADS 常數
            if (cardName === '未知' && foundLead && star === 5) cardName = `${foundLead} (未知卡名)`;
        }

        // ── 時間戳記解析 ─────────────────────────────────────
        const tM = rawText.match(/(202\d)?[-/.]?\d{1,2}[-/.]\d{1,2}\s+\d{1,2}[:;.]\d{1,2}[:;.]\d{1,2}/);
        let time = lastTime; let hasRealTime = false;
        if (tM) {
            let timeStr = tM[0];
            if (!timeStr.startsWith('202')) timeStr = new Date().getFullYear() + '-' + timeStr.replace(/^[-/.]/, '');
            const parsed = new Date(
                timeStr.replace(/[-/.]/g, '-').replace(/[:;.]/g, ':').replace(/\s+/, 'T')
            ).getTime();
            if (!isNaN(parsed)) { time = parsed; lastTime = parsed; hasRealTime = true; }
        }

        // ── 保存 OCR 診斷資訊 ─────────────────────────────────────
        //    不影響原本資料格式，只額外增加 _starDebug。
        records.push({
            star,
            time,
            name: cardName,
            raw: rawText,
            _hasRealTime: hasRealTime,

            // 星級診斷資訊
            _starDebug: {
    textStar,
    colorStar,
    finalStar: star,
    conflict: starConflict,

    // 顏色分析詳細資料
    goldRatio: colorDebug?.goldRatio ?? null,
    purpleRatio: colorDebug?.purpleRatio ?? null,
    goldPixels: colorDebug?.goldPixels ?? 0,
    purplePixels: colorDebug?.purplePixels ?? 0,
    totalPixels: colorDebug?.totalPixels ?? 0,
    colorY: colorDebug?.y0 ?? null,
    colorHeight: colorDebug?.height ?? null
}
});
    }
    return records;
}

// ── fileToCanvas ──────────────────────────────────────────
//    將圖片檔案轉為 Canvas 供後續分析使用。
//    【Bug 修正】原版建立了 Blob URL 後從未釋放，每處理一張
//    圖片就洩漏一筆記憶體。現在在 onload 完成後立即呼叫
//    URL.revokeObjectURL() 釋放資源。
function fileToCanvas(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // 圖片繪製完成後立即釋放 Blob URL，防止記憶體洩漏
            URL.revokeObjectURL(img.src);
            const c = document.createElement('canvas');
            c.width  = img.width;
            c.height = img.height;
            c.getContext('2d').drawImage(img, 0, 0);
            resolve(c);
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src); // 失敗時也要釋放
            reject(new Error('圖片載入失敗'));
        };
        img.src = URL.createObjectURL(file);
    });
}

// ── countPulls ────────────────────────────────────────────
//    從所有 OCR 紀錄中找出五星位置，計算每次出金的間距（抽數），
//    並回傳最後一次出金後的已墊抽數（pendingPulls）。
function countPulls(records) {
    // 取出所有五星紀錄並保留其在陣列中的原始索引
    const pos          = records.map((r, i) => ({ ...r, i })).filter(r => r.star === 5);
    // 出金後到當前頁面末尾的距離即為已墊抽數
    const pendingPulls = pos.length > 0 ? pos[0].i : records.length;
    if (pos.length < 2) return { pullEvents: [], fiveStarCount: pos.length, pendingPulls, pos };

    return {
        // 每兩個相鄰五星之間的距離即為該次抽卡所花抽數
        pullEvents: pos.slice(0, -1).map((c, i) => ({
            name:     c.name,
            pulls:    pos[i + 1].i - c.i,
            time:     c.time,
            raw:      c.raw,
            prevName: pos[i + 1].name  // 供 handleOCR 判斷是否雙常駐
        })),
        fiveStarCount: pos.length,
        pendingPulls,
        pos
    };
}
