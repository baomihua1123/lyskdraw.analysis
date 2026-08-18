// love_and_deepspace_events.js

const eventCards = [
  // ================= 2024 =================
  {
    year: "2024",
    duration: "1.18-1.26",
    eventName: "綿綿長夢",
    poolType: "單人池1-1",
    cards: {
      "沈星回": ["心動變曲"]
    }
  },
  {
    year: "2024",
    duration: "1.27-2.4",
    eventName: "晚空微瀾",
    poolType: "單人池1-2",
    cards: {
      "祁煜": ["焰火如誓"]
    }
  },
  {
    year: "2024",
    duration: "2.5-2.19",
    eventName: "無人知曉時 ",
    poolType: "混池1",
    cards: {
      "沈星回": ["馥情一隅"],
      "祁煜": ["酌意邀禮"],
      "黎深": ["沉夜共醉"]
    }
  },
  {
    year: "2024",
    duration: "2.21-2.29",
    eventName: "暉色破曉前",
    poolType: "單人池1-3",
    cards: {
      "黎深": ["臨危"]
    }
  },
  {
    year: "2024",
    duration: "3.1-3.8",
    eventName: "獨家擁抱",
    poolType: "生日池",
    cards: {
      "祁煜": ["此生奇遇"]
    }
  },
  {
    year: "2024",
    duration: "3.11-3.23",
    eventName: "眸光映照處",
    poolType: "混池2",
    cards: {
      "沈星回": ["午後繾綣"],
      "祁煜": ["唇畔絮語"],
      "黎深": ["此心無間"]
    }
  },
  {
    year: "2024",
    duration: "4.3-4.17",
    eventName: "潮聲回唱之時",
    poolType: "日卡池 I",
    cards: {
      "祁煜": ["神殿日落", "神殿秘約"]
    }
  },
  {
    year: "2024",
    duration: "4.19-4.29",
    eventName: "燎然升溫",
    poolType: "單人池2-1",
    cards: {
      "沈星回": ["溫軟怦然"]
    }
  },
  {
    year: "2024",
    duration: "4.30-5.10",
    eventName: "二次撞擊",
    poolType: "單人池2-2",
    cards: {
      "黎深": ["專屬教學"]
    }
  },
  {
    year: "2024",
    duration: "5.13-5.27",
    eventName: "銀月流爍夜",
    poolType: "日卡池 I",
    cards: {
      "沈星回": ["未夜雨意", "未夜心聲"]
    }
  },
  {
    year: "2024",
    duration: "5.28-6.7",
    eventName: "日色初照",
    poolType: "單人池2-3",
    cards: {
      "祁煜": ["煦日私旅"]
    }
  },
  {
    year: "2024",
    duration: "6.7-6.21",
    eventName: "山隱靈蹤",
    poolType: "日卡池 I",
    cards: {
      "黎深": ["擁雪未眠", "擁雪見緣"]
    }
  },
  {
    year: "2024",
    duration: "6.25-7.10",
    eventName: "雙影交疊時",
    poolType: "混池3",
    cards: {
      "沈星回": ["二十一日"],
      "祁煜": ["以花之名"],
      "黎深": ["溺於溫雪"]
    }
  },
  {
    year: "2024",
    duration: "7.15-8.1",
    eventName: "不設防禁區",
    poolType: "單人池2-4",
    cards: {
      "秦徹": ["不設防禁區"]
    }
  },
  {
    year: "2024",
    duration: "8.7-8.27",
    eventName: "半透明侵占",
    poolType: "混池4",
    cards: {
      "沈星回": ["執迷俘惑"],
      "祁煜": ["縱我沉淪"],
      "黎深": ["長日留痕"],
      "秦徹": ["失落綠洲"]
    }
  },
  {
    year: "2024",
    duration: "8.31-9.7",
    eventName: "昔願逢時",
    poolType: "生日池",
    cards: {
      "黎深": ["一往而深"]
    }
  },
  {
    year: "2024",
    duration: "9.10-9.20",
    eventName: "長思入畫",
    poolType: "單人池3-1",
    cards: {
      "祁煜": ["長思入畫"]
    }
  },
  {
    year: "2024",
    duration: "9.23-10.9",
    eventName: "欲攬旖旎色",
    poolType: "混池5",
    cards: {
      "沈星回": ["聆花意"],
      "祁煜": ["畫琳琅"],
      "黎深": ["枕月眠"],
      "秦徹": ["風臨野"]
    }
  },
  {
    year: "2024",
    duration: "10.11-10.18",
    eventName: "銀河搖曳",
    poolType: "生日池",
    cards: {
      "沈星回": ["星辰有信"]
    }
  },
  {
    year: "2024",
    duration: "10.20-10.30",
    eventName: "熾光淋漓",
    poolType: "單人池3-2",
    cards: {
      "秦徹": ["熾光淋漓"]
    }
  },
  {
    year: "2024",
    duration: "10.31-11.10",
    eventName: "脈脈傾音",
    poolType: "單人池3-3",
    cards: {
      "黎深": ["脈脈傾音"]
    }
  },
  {
    year: "2024",
    duration: "11.12-11.30",
    eventName: "遵命，飼養官",
    poolType: "混池6",
    cards: {
      "沈星回": ["茸毛攻勢"],
      "祁煜": ["搖尾時刻"],
      "黎深": ["耳尖沉溺"],
      "秦徹": ["貓德守則"]
    }
  },
  {
    year: "2024",
    duration: "12.2-12.16",
    eventName: "龍影隕落處",
    poolType: "日卡池 I",
    cards: {
      "秦徹": ["深淵秘印", "深淵霞暈"]
    }
  },
  {
    year: "2024",
    duration: "12.18-12.28",
    eventName: "銀瀑奏鳴",
    poolType: "單人池3-4",
    cards: {
      "沈星回": ["銀瀑奏鳴"]
    }
  },
  {
    year: "2024",
    duration: "12.31-1.20",
    eventName: "奔湧至昨夜盡頭",
    poolType: "混池7",
    cards: {
      "沈星回": ["霧色勾勒"],
      "祁煜": ["潮間帶"],
      "黎深": ["零下沸點"],
      "秦徹": ["潛入夜"]
    }
  },

  // ================= 2025 =================
  {
    year: "2025",
    duration: "1.22-2.8",
    eventName: "觸痛訊號",
    poolType: "單人池3-5",
    cards: {
      "夏以晝": ["觸痛訊號"]
    }
  },
  {
    year: "2025",
    duration: "2.10-2.27",
    eventName: "明日無處可逃",
    poolType: "混池1",
    cards: {
      "沈星回": ["虛構妄想"],
      "祁煜": ["狂熱劑量"],
      "黎深": ["即時紊亂"],
      "秦徹": ["無罪樊籠"],
      "夏以晝": ["附骨之痕"]
    }
  },
  {
    year: "2025",
    duration: "3.1-3.8",
    eventName: "沉入無盡海",
    poolType: "生日池",
    cards: {
      "祁煜": ["沉入無盡海"]
    }
  },
  {
    year: "2025",
    duration: "3.1-3.8",
    eventName: "獨家擁抱",
    poolType: "復刻",
    cards: {
      "祁煜": ["此生奇遇"]
    }
  },
  {
    year: "2025",
    duration: "3.9-3.18",
    eventName: "願緣長",
    poolType: "單人池4-1",
    cards: {
      "黎深": ["願緣長"]
    }
  },
  {
    year: "2025",
    duration: "3.20-3.27",
    eventName: "潮聲回唱之時",
    poolType: "日卡池 I (復刻)",
    cards: {
      "祁煜": ["神殿日落", "神殿秘約"]
    }
  },
  {
    year: "2025",
    duration: "3.28-4.11",
    eventName: "當宇宙陷落",
    poolType: "日卡池 I",
    cards: {
      "夏以晝": ["寂路不歸", "寂路同赴"]
    }
  },
  {
    year: "2025",
    duration: "4.13-4.20",
    eventName: "至心棲之處",
    poolType: "生日池",
    cards: {
      "秦徹": ["至心棲之處"]
    }
  },
  {
    year: "2025",
    duration: "4.21-4.28",
    eventName: "銀月流爍夜",
    poolType: "日卡池 I (復刻)",
    cards: {
      "沈星回": ["未夜雨意", "未夜心聲"]
    }
  },
  {
    year: "2025",
    duration: "4.30-5.18",
    eventName: "春天對花所做的事",
    poolType: "混池2",
    cards: {
      "沈星回": ["夕花顯影"],
      "祁煜": ["盈盈搖曳"],
      "黎深": ["馥郁圈占"],
      "秦徹": ["花漫谷間"],
      "夏以晝": ["浮花以載"]
    }
  },
  {
    year: "2025",
    duration: "5.19-5.26",
    eventName: "山隱靈蹤",
    poolType: "日卡池 I (復刻)",
    cards: {
      "黎深": ["擁雪未眠", "擁雪見緣"]
    }
  },
  {
    year: "2025",
    duration: "5.29-6.6",
    eventName: "寸寸熱潮",
    poolType: "單人池4-2",
    cards: {
      "沈星回": ["寸寸熱潮"]
    }
  },
  {
    year: "2025",
    duration: "6.8-6.15",
    eventName: "無可逃逸夜",
    poolType: "生日池",
    cards: {
      "夏以晝": ["無可逃逸夜"]
    }
  },
  {
    year: "2025",
    duration: "6.17-7.1",
    eventName: "當海湮沒於海",
    poolType: "日卡池 II",
    cards: {
      "祁煜": ["霧海神臨", "霧海離歌"]
    }
  },
  {
    year: "2025",
    duration: "7.3-7.22",
    eventName: "於深空見證的",
    poolType: "混池3",
    cards: {
      "沈星回": ["星泊地"],
      "祁煜": ["朝沙嶼"],
      "黎深": ["渡雪境"],
      "秦徹": ["明暗界"],
      "夏以晝": ["永無島"]
    }
  },
  {
    year: "2025",
    duration: "7.25-8.8",
    eventName: "沉墜的冠冕",
    poolType: "日卡池 II",
    cards: {
      "沈星回": ["夜誓迷月", "夜誓燼歌"]
    }
  },
  {
    year: "2025",
    duration: "8.12-8.31",
    eventName: "盛夏與你與海風",
    poolType: "混池4",
    cards: {
      "沈星回": ["沁涼瞬擊"],
      "祁煜": ["失重熱浪"],
      "黎深": ["私奔潮線"],
      "秦徹": ["戀速引擎"],
      "夏以晝": ["澄風掠海"]
    }
  },
  {
    year: "2025",
    duration: "8.31-9.7",
    eventName: "以我寄黎明",
    poolType: "生日池",
    cards: {
      "黎深": ["以我寄黎明"]
    }
  },
  {
    year: "2025",
    duration: "8.31-9.7",
    eventName: "昔願逢時",
    poolType: "復刻",
    cards: {
      "黎深": ["一往而深"]
    }
  },
  {
    year: "2025",
    duration: "9.9-9.18",
    eventName: "熱意揣度",
    poolType: "單人池4-3",
    cards: {
      "秦徹": ["熱意揣度"]
    }
  },
  {
    year: "2025",
    duration: "9.19-9.27",
    eventName: "無人知曉時",
    poolType: "復刻混池1",
    cards: {
      "沈星回": ["馥情一隅"],
      "祁煜": ["酌意邀禮"],
      "黎深": ["沉夜共醉"]
    }
  },
  {
    year: "2025",
    duration: "9.25-10.9",
    eventName: "時與世的邊緣",
    poolType: "日卡池 II",
    cards: {
      "黎深": ["神諭聖詠", "神諭歸寂"]
    }
  },
  {
    year: "2025",
    duration: "10.11-10.18",
    eventName: "來自星軌間",
    poolType: "生日池",
    cards: {
      "沈星回": ["來自星軌間"]
    }
  },
  {
    year: "2025",
    duration: "10.11-10.18",
    eventName: "銀河搖曳",
    poolType: "復刻",
    cards: {
      "沈星回": ["星辰有信"]
    }
  },
  {
    year: "2025",
    duration: "10.20-10.27",
    eventName: "龍影隕落處",
    poolType: "日卡池 I (復刻)",
    cards: {
      "秦徹": ["深淵秘印", "深淵霞暈"]
    }
  },
  {
    year: "2025",
    duration: "10.29-11.18",
    eventName: "直到心跳沸騰",
    poolType: "混池5",
    cards: {
      "沈星回": ["錯拍溯行"],
      "祁煜": ["聲浪復燃"],
      "黎深": ["冷調交熔"],
      "秦徹": ["即興放逐"],
      "夏以晝": ["灼頻過載"]
    }
  },
  {
    year: "2025",
    duration: "11.13-11.20",
    eventName: "綿綿長夢",
    poolType: "單人池復刻1-1",
    cards: {
      "沈星回": ["心動變曲"]
    }
  },
  {
    year: "2025",
    duration: "11.21-11.30",
    eventName: "甜野極馳",
    poolType: "單人池4-4",
    cards: {
      "祁煜": ["甜野極馳"]
    }
  },
  {
    year: "2025",
    duration: "12.2-12.16",
    eventName: "銀翼安魂地",
    poolType: "日卡池 II",
    cards: {
      "秦徹": ["猩紅彌散", "猩紅席卷"]
    }
  },
  {
    year: "2025",
    duration: "12.11-12.18",
    eventName: "晚空微瀾",
    poolType: "單人池復刻1-2",
    cards: {
      "祁煜": ["焰火如誓"]
    }
  },
  {
    year: "2025",
    duration: "12.18-12.27",
    eventName: "慵懶共謀",
    poolType: "單人池4-5",
    cards: {
      "夏以晝": ["慵懶共謀"]
    }
  },
  {
    year: "2025",
    duration: "12.24-12.31",
    eventName: "暉色破曉前",
    poolType: "單人池復刻1-3",
    cards: {
      "黎深": ["臨危"]
    }
  },
  {
    year: "2025",
    duration: "12.31-1.21",
    eventName: "愛·宇宙·詩王座",
    poolType: "混池6",
    cards: {
      "沈星回": ["洄光頌"],
      "祁煜": ["宴神曲"],
      "黎深": ["辰寰律"],
      "秦徹": ["混沌紀"],
      "夏以晝": ["浴冕歌"]
    }
  },

  // ================= 2026 =================
  {
    year: "2026",
    duration: "1.23-2.1",
    eventName: "竊竊私吻",
    poolType: "單人池5-1",
    cards: {
      "黎深": ["竊竊私吻"]
    }
  },
  {
    year: "2026",
    duration: "2.2-2.9",
    eventName: "當宇宙陷落",
    poolType: "日卡池 I (復刻)",
    cards: {
      "夏以晝": ["寂路不歸", "寂路同赴"]
    }
  },
  {
    year: "2026",
    duration: "2.10-2.27",
    eventName: "人間繾綣意",
    poolType: "混池1",
    cards: {
      "沈星回": ["問劍觀花"],
      "祁煜": ["錦夜琢心"],
      "黎深": ["飛鳶墜春"],
      "秦徹": ["千燈共我"],
      "夏以晝": ["晴晝當歸"]
    }
  },
  {
    year: "2026",
    duration: "3.1-3.8",
    eventName: "步步向晚晴",
    poolType: "生日池",
    cards: {
      "祁煜": ["步步向晚晴"]
    }
  },
  {
    year: "2026",
    duration: "3.1-3.8",
    eventName: "沉入無盡海",
    poolType: "復刻",
    cards: {
      "祁煜": ["沉入無盡海"]
    }
  },
  {
    year: "2026",
    duration: "3.1-3.8",
    eventName: "獨家擁抱",
    poolType: "復刻",
    cards: {
      "祁煜": ["此生奇遇"]
    }
  },
  {
    year: "2026",
    duration: "3.9-3.18",
    eventName: "煙火來處",
    poolType: "單人池5-2",
    cards: {
      "沈星回": ["煙火來處"]
    }
  },
  {
    year: "2026",
    duration: "3.19-3.27",
    eventName: "眸光映照處",
    poolType: "復刻混池",
    cards: {
      "沈星回": ["午後繾綣"],
      "祁煜": ["唇畔絮語"],
      "黎深": ["此心無間"]
    }
  },
  {
    year: "2026",
    duration: "3.28-4.11",
    eventName: "萬鬼行絕",
    poolType: "日卡池 II",
    cards: {
      "夏以晝": ["沉冥幽眷", "沉冥相遙"]
    }
  },
  {
    year: "2026",
    duration: "4.6-4.13",
    eventName: "燎然升溫",
    poolType: "單人池復刻2-1",
    cards: {
      "沈星回": ["溫軟怦然"]
    }
  },
  {
    year: "2026",
    duration: "4.13-4.20",
    eventName: "肆雨照夜",
    poolType: "生日池",
    cards: {
      "秦徹": ["肆雨照夜"]
    }
  },
  {
    year: "2026",
    duration: "4.13-4.20",
    eventName: "至心棲之處",
    poolType: "復刻",
    cards: {
      "秦徹": ["至心棲之處"]
    }
  },
  {
    year: "2026",
    duration: "4.21-4.28",
    eventName: "當海湮沒於海",
    poolType: "日卡池 III(復刻)",
    cards: {
      "祁煜": ["霧海神臨", "霧海離歌"]
    }
  } ,
   {
    year: "2026",
    duration: "4.30-5.15",
    eventName: "渴慕與浮沉",
    poolType: "混池2",
    cards: {
      "沈星回": ["池光溫陷"],
      "祁煜": ["瀲灩花期"],
      "黎深": ["雪色深流"],
      "秦徹": ["繚夜魂與"],
      "夏以晝": ["蔓生本能"]
    }
  } , 
  
  {
    year: "2026",
    duration: "5.08-5.15",
    eventName: "二次撞擊",
    poolType: "復刻",
    cards: {
      "黎深": ["專屬教學"]
    }
  },
// ================= 測試資料 =================
{
  year: "2026",
  duration: "8.17-8.20",
  eventName: "測試卡池",
  poolType: "單人池測試",
  cards: {
    "沈星回": ["測試卡片a"]
    "祁煜": ["測試卡片b"]
    "黎深": ["測試卡片c"]
    "秦徹": ["測試卡片d"]
    "夏以晝": ["測試卡片e"]
  }
}
];
