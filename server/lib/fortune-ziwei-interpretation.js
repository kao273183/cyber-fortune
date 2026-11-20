/**
 * server/lib/fortune-ziwei-interpretation.js
 * 紫微斗數十二宮位互動、星曜亮度、吉煞輔曜、四化與三方四正結構化解讀規則引擎
 * 提供可審閱、有據可循的傳統命理典籍規則庫與現代生活解讀
 * 零原生 C++ 依賴，純 JavaScript 規則判定
 */

// 1. 十四主星光度定義 (Brightness Definitions)
const BRIGHTNESS_DEFINITIONS = {
  廟: {
    label: '廟',
    definition: '星曜能量最為純粹強烈，正面特質完全展現，在該宮位具備頂級發揮空間與主控力。',
    intensity: 5,
  },
  旺: {
    label: '旺',
    definition: '星曜氣勢充沛光芒外露，正面效益顯著，能充分發揮其特質並掌控宮位主題。',
    intensity: 4,
  },
  得: {
    label: '得',
    definition: '得地之象，具備良好發揮基石，實力平穩踏實，成效穩定值得信賴。',
    intensity: 3,
  },
  利: {
    label: '利',
    definition: '利益之象，能量中上，利於發揮長處，遇到合適環境能取得突出成果。',
    intensity: 3,
  },
  平: {
    label: '平',
    definition: '力量平淡均衡，吉凶作用不明顯，主要隨同宮或會照吉煞星曜引導其走勢。',
    intensity: 2,
  },
  不: {
    label: '不',
    definition: '不得地，力量有所受限，特質展現稍顯晦澀，需更多努力或輔助方能成事。',
    intensity: 1,
  },
  陷: {
    label: '陷',
    definition: '星曜能量處於弱勢，容易展現星性之負面或被動特質，須歷經更多磨礪或藉由吉曜改善。',
    intensity: 0,
  },
};

// 2. 十四主星核心屬性與現代生活解讀
const MAJOR_STARS_META = {
  紫微: {
    nature: '北斗帝星，五行屬己土',
    traditional: '帝王之星，主尊貴、自主決策、核心領導力與統御全域之氣度。',
    modernDev: '天生的領袖氣度與拍板定案的決策力，在團體中自帶定海神針般的權威感。',
  },
  天機: {
    nature: '南斗善星，五行屬乙木',
    traditional: '智慧謀略之星，主機敏靈活、推演運籌、擅長規劃與應變。',
    modernDev: '縝密的邏輯思維與全局規劃力，擅長在千頭萬緒的局面中迅速理清脈絡。',
  },
  太陽: {
    nature: '中天主星，五行屬丙火',
    traditional: '光明博愛之星，主博施無私、光明磊落、外向拓展與公眾影響力。',
    modernDev: '樂於分享、熱心助人的團隊精神，願意傾囊相授，照亮身邊人的盲點與困惑。',
  },
  武曲: {
    nature: '北斗財星，五行屬辛金',
    traditional: '財帛剛毅之星，主果斷剛毅、執行力強、實事求是、攻堅不懈。',
    modernDev: '說到做到的實幹派攻堅主力，面對高壓挑戰毫不退縮，崇尚看得見的實質回報。',
  },
  天同: {
    nature: '南斗福星，五行屬壬水',
    traditional: '福德隨和之星，主溫和包容、重視和諧氛圍、富同理心與復原力。',
    modernDev: '重視相處的舒適感與生活品味，是天生的開心果，能凝聚向心力並幫大家排解壓力。',
  },
  廉貞: {
    nature: '北斗次桃花星，五行屬丁火',
    traditional: '精密權變之星，主原則分明、審美自律、敏銳專注、具高度自我要求。',
    modernDev: '對細節有潔癖、做事講求原則與分寸，自律甚嚴，也懂得劃清界線保護自己。',
  },
  天府: {
    nature: '南斗令星兼庫星，五行屬戊土',
    traditional: '財庫守護之星，主沉穩持重、容納百川、守成聚富與系統性防護。',
    modernDev: '家庭與團隊的穩定靠山，善於理財守成、未雨綢繆，讓生活底盤堅若磐石。',
  },
  太陰: {
    nature: '中天財星，五行屬癸水',
    traditional: '溫婉富庶之星，主細膩周密、深思熟慮、觀察入微與暗中布局。',
    modernDev: '心思細膩的觀察家，善於默默打理財務與家務，一眼看穿藏在細節裡的端倪與心事。',
  },
  貪狼: {
    nature: '北斗第一星兼桃花星，五行屬甲木/癸水',
    traditional: '慾望靈動之星，主強大求知慾、才藝多面、跨領域敏銳與靈活適應力。',
    modernDev: '對新鮮事物嗅覺靈敏的潮流玩家，熱衷嘗試新興趣、新技能與新圈子，學習速度驚人。',
  },
  巨門: {
    nature: '北斗暗星，五行屬癸水',
    traditional: '辯才深究之星，主批判思維、追根究柢、探求真相，亦需慎防口舌。',
    modernDev: '心思縝密、善於發現問題的把關者，凡事打破砂鍋問到底，一針見血但需拿捏說話分寸。',
  },
  天相: {
    nature: '南斗印星，五行屬壬水',
    traditional: '輔弼宰相之星，主誠信端正、規矩制度、執行協調與中介轉接。',
    modernDev: '團隊中的協調者與規矩守護者，擅長居中斡旋、信守承諾，讓各方合作有章可循。',
  },
  天梁: {
    nature: '南斗蔭星，五行屬戊土',
    traditional: '貴人延壽之星，主長輩提攜、經驗傳承、主持公道與逢凶化吉。',
    modernDev: '可靠的人生導師與危機處理高手，在眾人慌亂時能沉著應對、帶領大家化險為夷。',
  },
  七殺: {
    nature: '南斗將星，五行屬庚金/丁火',
    traditional: '威勇將軍之星，主主動出擊、開疆拓土、敢為人先、勇於承擔風險。',
    modernDev: '開疆闢土的急先鋒，敢於打破舊有框架、獨當一面，帶頭突破事業瓶頸。',
  },
  破軍: {
    nature: '北斗耗星兼先鋒，五行屬癸水',
    traditional: '破舊立新之星，主打破常規、顛覆革新、敏捷試錯與先破後成。',
    modernDev: '破舊立新的改革者，敢於告別不適合的舊習慣與舊環境，為人生開創全新局面。',
  },
};

// 3. 本命四化傳統與現代生活定義 (Four Transformations)
const SIHUA_DEFINITIONS = {
  祿: {
    name: '化祿',
    type: 'lu',
    traditional: '主福祿吉慶、收穫豐沛、順遂擴展與機遇湧現。為宮位注入豐厚資源。',
    modernDev: '資源充沛與靈感井噴，做事順風順水，容易收穫肯定、好人緣與實質回報。',
  },
  權: {
    name: '化權',
    type: 'quan',
    traditional: '主掌權主控、意志堅定、魄力決策與專業威望。增強抗壓與攻堅力。',
    modernDev: '話語權與主導力提升，在工作規劃與家中大小事上都具備決定性的推動力。',
  },
  科: {
    name: '化科',
    type: 'ke',
    traditional: '主名望聲譽、才華認可、考評晉升與文墨亨通。利於建立良好口碑。',
    modernDev: '名聲口碑漸起，付出容易被看見，考試、考評與各類評選都能收穫高分肯定。',
  },
  忌: {
    name: '化忌',
    type: 'ji',
    traditional: '主執著繫念、考驗磨練、需格外留神與深耕補強之處。歷經打磨後反成利器。',
    modernDev: '人生的重要功課，容易在此領域遇到反覆糾結的難題，需耐心面對、穩紮穩打補強。',
  },
};

// 4. 輔曜神煞定義庫 (Minor Stars & Shensha)
const MINOR_STARS_META = {
  左輔: {
    type: 'auspicious',
    traditional: '同儕助力、忠實夥伴，行事多得平輩支援與有力協同。',
    modernDev: '默契十足的好搭檔，關鍵時刻總有朋友同事隨時補位支援。',
  },
  右弼: {
    type: 'auspicious',
    traditional: '智慧暗助、靈活協調，善於補足細節盲區化解僵局。',
    modernDev: '貼心的神隊友，總能在你忽略的細節處默默幫忙補位。',
  },
  文昌: {
    type: 'auspicious',
    traditional: '文才名譽、文墨考運，主合約規範、文書條理與專業認可。',
    modernDev: '文筆條理分明、擅長整理資料與規劃，考卷與書面報告都讓人一目了然。',
  },
  文曲: {
    type: 'auspicious',
    traditional: '口才辯才、靈感創意，善於言辭表達與人際邏輯溝通。',
    modernDev: '優異的表達與簡報能力，善於把艱澀的道理講得生動易懂、打動人心。',
  },
  天魁: {
    type: 'auspicious',
    traditional: '陽貴人星，多得長輩、長官之公開賞識、提攜與政策護航。',
    modernDev: '長輩與上司的強力背書，在升學、求職或新計畫上容易爭取到充足資源。',
  },
  天鉞: {
    type: 'auspicious',
    traditional: '陰貴人星，逢凶化吉，在暗處或意外機遇中常有轉機。',
    modernDev: '冥冥之中的暗中貴人，常在危機爆發前及時提點，幫你化險為夷。',
  },
  祿存: {
    type: 'auspicious',
    traditional: '正印天祿、守成儲蓄，為宮位注入深厚資產安定底盤。',
    modernDev: '穩健踏實的儲蓄與資產底氣，經得起時間考驗，讓生活安穩無後顧之憂。',
  },
  天馬: {
    type: 'auspicious',
    traditional: '驛馬奔騰、跨界開拓，愈動愈發，利於遠行與向外發展。',
    modernDev: '出差、旅行、搬遷與異地發展運勢極佳，越常走動越有新機會。',
  },
  擎羊: {
    type: 'inauspicious',
    traditional: '剛烈鋒銳、雷厲風行、具衝擊力，行事切忌急躁剛愎。',
    modernDev: '推動重大改變時記得顧及他人感受，防範因求快心急而引發衝突摩擦。',
  },
  陀羅: {
    type: 'inauspicious',
    traditional: '延宕纏繞、慢工細磨、反覆琢磨，易陷入糾葛但磨練心性。',
    modernDev: '面對拖延反覆、糾結難解的局面時，需要沉住氣慢慢理出頭緒。',
  },
  火星: {
    type: 'inauspicious',
    traditional: '暴烈突發、急如烈火、靈感瞬現，需防猝不及防之波折。',
    modernDev: '突如其來的情緒爆發或意外狀況，宜預留緩衝空間、適時踩下煞車。',
  },
  鈴星: {
    type: 'inauspicious',
    traditional: '沉潛剛烈、內斂綿長、隱性抗壓，需防暗處內耗。',
    modernDev: '悶在心裡的壓力與暗中內耗，需及早察覺並找到抒發管道。',
  },
  地空: {
    type: 'inauspicious',
    traditional: '天馬行空、不受拘束、精神豁達，利於抽象概念但需防落地踏空。',
    modernDev: '具備極具開創性的超前想法與創意，但需腳踏實地，確保好點子能如期落實。',
  },
  地劫: {
    type: 'inauspicious',
    traditional: '得失無常、資材耗損、多有意外開銷，宜踏實做足備援。',
    modernDev: '容易有意外開銷或資源流失，宜做好記帳預算並保留緊急預備金。',
  },
};

// 5. 十二宮位生活主題與現代生活關注點 (Palace Themes)
const PALACE_THEMES = {
  命宮: {
    traditional: '本命根基、性格稟賦、處世風格、精神核心與整體命格主軸。',
    modernDev: '天賦個性、抗壓韌性、待人處事的氣質與核心價值觀。',
  },
  兄弟宮: {
    traditional: '手足情誼、同儕親信、親近友人支援與事業初創時的合夥關係。',
    modernDev: '手足默契、死黨閨蜜相挺、一起打拚的革命情誼。',
  },
  夫妻宮: {
    traditional: '情感牽絆、伴侶性格氣質、親密關係互動模式與內在支持力量。',
    modernDev: '生活與加班的平衡、親密關係的情緒支撐、與另一半的生活合拍度。',
  },
  子女宮: {
    traditional: '子嗣緣分、晚輩傳承、創意衍生作品、個人成果的後續延伸。',
    modernDev: '親子互動、創意作品與副業孵化、提攜晚輩成長之成果。',
  },
  財帛宮: {
    traditional: '求財方式、財務管理型態、物質回報、商業敏感度與現金流穩健度。',
    modernDev: '績效分紅、薪資談判籌碼、斜槓兼職收入與實質回報。',
  },
  疾厄宮: {
    traditional: '身體底質、情緒耐受度、潛在身心疲勞點與健康養生關注重心。',
    modernDev: '作息與睡眠品質、腰椎頸椎防護、防範熬夜過勞與身心靈平衡。',
  },
  遷移宮: {
    traditional: '出外發展運勢、環境適應力、跨域社交形象與對外開拓之機遇。',
    modernDev: '出門旅遊運、異地發展順暢度、跳槽面試與公開場合表現運勢。',
  },
  交友宮: {
    traditional: '廣義人際網絡、下屬同事支持、人際協作摩擦度與團隊信任度。',
    modernDev: '跨部門合作效率、朋友圈的支持度、同事與下屬之間的相處和諧度。',
  },
  官祿宮: {
    traditional: '事業抱負、職場追求、專業競爭力、領導號召力與長期成就目標。',
    modernDev: '職場話語權、重大專案戰功、升遷天梯與晉身管理核心的潛力。',
  },
  田宅宮: {
    traditional: '居所安寧、家產底蘊、家族資產庇蔭與個人私人基地之安定感。',
    modernDev: '居家佈置舒適度、買房租屋運、家庭氛圍與個人專屬的放鬆角落。',
  },
  福德宮: {
    traditional: '心靈安頓、精神寄託、享受能力、自我療癒與深層福澤厚薄。',
    modernDev: '功德充盈、無事一身輕的鬆弛感、沉浸興趣嗜好之精神滿足。',
  },
  父母宮: {
    traditional: '長輩提攜、上司主管器重、體系考核評價與官方認證資歷。',
    modernDev: '長輩與主管信任度、各類審核申請通過率、背鍋防禦力與績效考核。',
  },
};

// 6. 知名同宮與三方會照格局庫 (Classic Patterns & Rules)
const COMBINATION_RULES = [
  {
    ruleId: 'RULE_ZI_FU_SAME',
    name: '紫微天府同宮',
    targetStars: ['紫微', '天府'],
    type: 'same_palace',
    source: '中州派紫微斗數講義',
    summary: '帝令齊聚，統御全域，兼具威權與守成',
    explanation: '紫微帝星與天府庫星同聚一宮（必在子午二宮），兼具前瞻決策格局與穩固守成的定力，行事穩重有度，能擔大任。',
    techMetaphor: '兼具開創格局與守成定力，既能描繪宏大藍圖，又能把家底與團隊打理得穩如泰山。',
  },
  {
    ruleId: 'RULE_ZI_XIANG_SAME',
    name: '紫微天相同宮',
    targetStars: ['紫微', '天相'],
    type: 'same_palace',
    source: '紫微斗數全書',
    summary: '帝印同座，協同執行力極強，文武兼備',
    explanation: '紫微與天相同宮（在辰戌二宮），君臣合德，具有強烈的組織規劃與推動能力，善於將宏觀願景拆解為落地的執行規範。',
    techMetaphor: '能將模糊的願景化為清晰可行的行動計畫，帶動身邊眾人同心協力、高效落實。',
  },
  {
    ruleId: 'RULE_ZI_SHA_SAME',
    name: '紫微七殺同宮',
    targetStars: ['紫微', '七殺'],
    type: 'same_palace',
    source: '骨髓賦',
    summary: '化殺為權，敢作敢當，具開創性魄力',
    explanation: '紫微七殺同宮（在巳亥二宮），七殺受紫微制化轉為權柄，主開創改革，敢於打破陳舊格局，具備強大的突破力。',
    techMetaphor: '帶領眾人突破困境的急先鋒，勇於扛下改革與轉型的重責。',
  },
  {
    ruleId: 'RULE_WU_SHA_SAME',
    name: '武曲七殺同宮',
    targetStars: ['武曲', '七殺'],
    type: 'same_palace',
    source: '紫微斗數全書',
    summary: '剛烈果敢，攻堅主力，執行力迅猛',
    explanation: '武曲與七殺皆具金性肅殺剛毅之氣（在卯酉二宮），行事俐落絕不拖泥帶水，適應高壓節奏，攻堅拔寨成效顯著。',
    techMetaphor: '高壓環境下的攻堅主力，任何難啃的硬骨頭與僵局到了手上皆能迎刃而解。',
  },
  {
    ruleId: 'RULE_WU_TAN_SAME',
    name: '武曲貪狼同宮',
    targetStars: ['武曲', '貪狼'],
    type: 'same_palace',
    source: '骨髓賦',
    summary: '武貪同行，大器晚成，後勁十足',
    explanation: '武曲之剛實結合貪狼之靈活（在丑未二宮），少年多歷經打磨沉澱，歷練豐富後厚積薄發，常在中年迎來爆發性成就。',
    techMetaphor: '基本功扎實且不斷吸收新知，隨著歲月歷練層層累積，展現無可取代的專業價值。',
  },
  {
    ruleId: 'RULE_SUN_JU_SAME',
    name: '太陽巨門同宮',
    targetStars: ['太陽', '巨門'],
    type: 'same_palace',
    source: '太微賦',
    summary: '巨日同宮，口才辯才宏亮，影響力深遠',
    explanation: '太陽之光明驅散巨門之幽暗（在寅申二宮），主思路開闊、辯才無礙，利於公共事務、傳播與跨領域合作。',
    techMetaphor: '圈子裡的人氣明星與卓越的知識傳播者，善於把複雜的道理說得通俗易懂並凝聚共識。',
  },
  {
    ruleId: 'RULE_JI_LIANG_SAME',
    name: '天機天梁同宮',
    targetStars: ['天機', '天梁'],
    type: 'same_palace',
    source: '紫微斗數全書',
    summary: '機梁善談兵，策劃精妙，謀略推演深刻',
    explanation: '天機之智謀遇上天梁之蔭蔽深思（在辰戌二宮），長於策略推演、評估審議與諮詢規劃，見解深刻。',
    techMetaphor: '親友遇到抉擇時最想請教的智囊軍師，總能提前半年看出未來發展的盲點與隱憂。',
  },
  {
    ruleId: 'RULE_JI_JU_SAME',
    name: '天機巨門同宮',
    targetStars: ['天機', '巨門'],
    type: 'same_palace',
    source: '骨髓賦',
    summary: '巨機同臨，心思敏銳，擅於抽絲剝繭',
    explanation: '天機動態思維配合巨門深究本質之特性（在卯酉二宮），具備極高洞察力與批判性思維，善於揪出隱藏的問題癥結。',
    techMetaphor: '抽絲剝繭的偵探型人物，能從蛛絲馬跡與零碎線索中迅速拼湊出事情真相。',
  },
  {
    ruleId: 'RULE_TONG_YIN_SAME',
    name: '天同太陰同宮',
    targetStars: ['天同', '太陰'],
    type: 'same_palace',
    source: '太微賦',
    summary: '水星匯聚，溫雅和諧，富人文與細緻感',
    explanation: '天同福星與太陰財星同居（在子午二宮），個性溫和親切、注重品味與人際和諧，在穩定環境中能持續產出高品質成果。',
    techMetaphor: '對生活美學與質感有極致追求，不僅把日子過得舒適愜意，更讓身邊的人如沐春風。',
  },
  {
    ruleId: 'RULE_LIAN_XIANG_SAME',
    name: '廉貞天相同宮',
    targetStars: ['廉貞', '天相'],
    type: 'same_palace',
    source: '中州派紫微斗數講義',
    summary: '廉相相濟，守正出奇，制度執行典範',
    explanation: '廉貞之精準被天相之印信規範引導（在子午二宮），行事遵守法度規範，責任心極強，能在複雜人際環境中游刃有餘。',
    techMetaphor: '規範制度與品質把關的守護者，凡經手之事皆一絲不苟，確保每個環節都符合最高標準。',
  },
  {
    ruleId: 'RULE_SAN_FANG_SHA_PO_LANG',
    name: '殺破狼三方格局',
    targetStars: ['七殺', '破軍', '貪狼'],
    type: 'sanfang',
    source: '紫微斗數全書',
    summary: '動態變革，開創新局，抗逆力與敏捷力兼備',
    explanation: '三方四正中七殺、破軍、貪狼互為拱照，象徵生命步調充滿挑戰、更迭與變革，人生起伏中蘊含無限成長空間。',
    techMetaphor: '勇於嘗試與破舊立新的精神，不畏懼轉型陣痛，能在快速變動的時代浪潮中引領潮流。',
  },
  {
    ruleId: 'RULE_SAN_FANG_JI_YUE_TONG_LIANG',
    name: '機月同梁三方格局',
    targetStars: ['天機', '太陰', '天同', '天梁'],
    type: 'sanfang',
    source: '骨髓賦',
    summary: '穩健策劃，組織核心，深厚專業沉澱',
    explanation: '三方四正中天機、太陰、天同、天梁相互照應，主謀略長遠、行事穩健、不走偏鋒，長於大體系中的職能深耕。',
    techMetaphor: '大型組織裡的中堅力量，深耕專業與制度流程，穩紮穩打累積可長可久的職涯資產。',
  },
  {
    ruleId: 'RULE_SAN_FANG_FU_XIANG',
    name: '府相朝垣格局',
    targetStars: ['天府', '天相'],
    type: 'sanfang',
    source: '太微賦',
    summary: '衣食豐足，體制庇蔭，資源充裕安定',
    explanation: '天府天相在三方四正互相拱照，象徵資源底氣雄厚，易得平台或組織賦能，行事沉著無後顧之憂。',
    techMetaphor: '背靠穩固的家庭支援與組織資源，無後顧之憂，能將精力 100% 聚焦在真正重要的事上。',
  },
  {
    ruleId: 'RULE_LU_MA_JIAO_CHI',
    name: '祿馬交馳',
    targetStars: ['祿存', '天馬'],
    type: 'sanfang_or_same',
    source: '骨髓賦',
    summary: '愈動愈發，跨界生財，利於向外拓展',
    explanation: '祿存與天馬同宮或在三方四正會合，象徵活動力與實質回饋形成良性循環，越積極主動開拓，越能斬獲豐厚收益。',
    techMetaphor: '跨區域、跨領域拓展人脈與事業版圖，四處奔走累積的經驗與影響力都能轉化為實質紅利。',
  },
  {
    ruleId: 'RULE_CHANG_QU_SAME_OR_SANFANG',
    name: '昌曲齊會',
    targetStars: ['文昌', '文曲'],
    type: 'sanfang_or_same',
    source: '太微賦',
    summary: '文采斐然，考運亨通，文件規範俱佳',
    explanation: '文昌與文曲同宮或在三方照映，主文思泉湧、邏輯嚴密、考試合格率高，善於撰寫結構化篇章。',
    techMetaphor: '卓越的文字表達與寫作能力，報告企劃一次過關，筆下文章深受眾人喜愛。',
  },
];

/**
 * 對特定宮位進行深度結構化解讀分析
 * @param {Object} chart calculateZiweiChart 產出之完整星盤
 * @param {number} palaceIndex 0~11
 * @returns {Object} 結構化宮位解讀物件
 */
function interpretPalace(chart, palaceIndex) {
  const palaces = chart.palaces;
  const p = palaces[palaceIndex];
  if (!p) return null;

  const branchIdx = p.branchIndex;
  const palaceName = p.name;
  const theme = PALACE_THEMES[palaceName] || {
    traditional: `${palaceName}傳統關注領域`,
    modernDev: `${palaceName}現代生活關注點`,
  };

  // 1. 主星詳細資料
  const mainStarsInterpreted = p.mainStars.map((s) => {
    const meta = MAJOR_STARS_META[s.name] || {};
    const bDef = BRIGHTNESS_DEFINITIONS[s.brightness] || BRIGHTNESS_DEFINITIONS.平;
    const sihuaDef = s.sihua ? SIHUA_DEFINITIONS[s.sihua] : null;

    return {
      name: s.name,
      brightness: s.brightness,
      brightnessDefinition: bDef.definition,
      intensity: bDef.intensity,
      sihua: s.sihua,
      sihuaName: sihuaDef ? sihuaDef.name : null,
      sihuaDefinition: sihuaDef ? sihuaDef.traditional : null,
      sihuaDevAdvice: sihuaDef ? sihuaDef.modernDev : null,
      nature: meta.nature || '十四主星',
      traditional: meta.traditional || '',
      modernDev: meta.modernDev || '',
    };
  });

  // 2. 輔星神煞詳細資料
  const minorStarsInterpreted = p.minorStars.map((m) => {
    const meta = MINOR_STARS_META[m.name] || {};
    return {
      name: m.name,
      type: m.type,
      traditional: meta.traditional || '輔曜助星',
      modernDev: meta.modernDev || '生活中的輔助助力',
    };
  });

  // 3. 空宮判定
  const isEmptyPalace = mainStarsInterpreted.length === 0;

  // 4. 三方四正關聯宮位與星曜萃取
  const oppositeBranchIdx = (branchIdx + 6) % 12;
  const sanHe1BranchIdx = (branchIdx + 4) % 12;
  const sanHe2BranchIdx = (branchIdx + 8) % 12;

  const oppositePalace = palaces.find((x) => x.branchIndex === oppositeBranchIdx);
  const sanHe1Palace = palaces.find((x) => x.branchIndex === sanHe1BranchIdx);
  const sanHe2Palace = palaces.find((x) => x.branchIndex === sanHe2BranchIdx);

  const sanFangPalaces = [p, oppositePalace, sanHe1Palace, sanHe2Palace].filter(Boolean);

  // 匯總本宮與三方星曜集合
  const residentStarNames = new Set([
    ...p.mainStars.map((s) => s.name),
    ...p.minorStars.map((m) => m.name),
  ]);

  const sanFangStarNames = new Set();
  sanFangPalaces.forEach((sp) => {
    sp.mainStars.forEach((s) => sanFangStarNames.add(s.name));
    sp.minorStars.forEach((m) => sanFangStarNames.add(m.name));
  });

  // 5. 規則匹配 (Rule Matching)
  const matchedRules = [];

  for (const rule of COMBINATION_RULES) {
    let matched = false;

    if (rule.type === 'same_palace') {
      // 必須全部同宮
      matched = rule.targetStars.every((st) => residentStarNames.has(st));
    } else if (rule.type === 'sanfang') {
      // 必須都在三方四正中，且至少有一顆在不同宮位形成照映
      matched = rule.targetStars.every((st) => sanFangStarNames.has(st));
    } else if (rule.type === 'sanfang_or_same') {
      // 同宮或三方會合皆可
      matched = rule.targetStars.every((st) => sanFangStarNames.has(st));
    }

    if (matched) {
      matchedRules.push({
        ruleId: rule.ruleId,
        name: rule.name,
        type: rule.type,
        stars: rule.targetStars,
        source: rule.source,
        summary: rule.summary,
        explanation: rule.explanation,
        techMetaphor: rule.techMetaphor,
      });
    }
  }

  // 6. 三方四正摘要
  const sanFangSiZheng = {
    opposite: {
      name: oppositePalace?.name || '對宮',
      branch: oppositePalace?.branch,
      stemBranch: oppositePalace?.stemBranch,
      branchIndex: oppositeBranchIdx,
      mainStars: oppositePalace?.mainStars.map((s) => `${s.name}(${s.brightness})`) || [],
      minorStars: oppositePalace?.minorStars.map((m) => m.name) || [],
      role: '外部投射、出外環境與對外互動窗口',
    },
    sanHe1: {
      name: sanHe1Palace?.name || '三合宮',
      branch: sanHe1Palace?.branch,
      stemBranch: sanHe1Palace?.stemBranch,
      branchIndex: sanHe1BranchIdx,
      mainStars: sanHe1Palace?.mainStars.map((s) => `${s.name}(${s.brightness})`) || [],
      minorStars: sanHe1Palace?.minorStars.map((m) => m.name) || [],
      role: '三合犄角支撐宮位之一，構成生命循環基石',
    },
    sanHe2: {
      name: sanHe2Palace?.name || '三合宮',
      branch: sanHe2Palace?.branch,
      stemBranch: sanHe2Palace?.stemBranch,
      branchIndex: sanHe2BranchIdx,
      mainStars: sanHe2Palace?.mainStars.map((s) => `${s.name}(${s.brightness})`) || [],
      minorStars: sanHe2Palace?.minorStars.map((m) => m.name) || [],
      role: '三合犄角支撐宮位之二，構成生命循環基石',
    },
    synthesis: `本宮【${p.name}】與對宮【${oppositePalace?.name}】、三合【${sanHe1Palace?.name}】及【${sanHe2Palace?.name}】共同構成本命關鍵脈絡，互相照應引導。`,
  };

  // 7. 空宮特殊引導
  const emptyPalaceGuidance = isEmptyPalace ? {
    notice: '本宮無十四主星落入，在紫微斗數中稱為「空宮」。',
    characteristics: '空宮特質開闊包容、可塑性極高，極易受外在環境與對宮星曜牽引。',
    oppositeReference: `推論本宮主題時，建議借對宮【${oppositePalace?.name}】所落星曜（${oppositePalace?.mainStars.map((s) => s.name).join('、') || '無主星'}）作為主要特質鏡射，但本宮同宮輔星神煞（${p.minorStars.map((m) => m.name).join('、') || '無輔星'}）的作用將格外凸顯。`,
  } : null;

  return {
    index: palaceIndex,
    palaceName,
    branch: p.branch,
    branchIndex: p.branchIndex,
    stem: p.stem,
    stemBranch: p.stemBranch,
    isShenGong: Boolean(p.isShenGong),
    theme,
    mainStars: mainStarsInterpreted,
    minorStars: minorStarsInterpreted,
    isEmptyPalace,
    emptyPalaceGuidance,
    matchedRules,
    sanFangSiZheng,
    coverage: {
      status: isEmptyPalace ? 'empty_palace' : 'interpreted',
      rulesCount: matchedRules.length,
      hasMajorStars: !isEmptyPalace,
      hasMinorStars: minorStarsInterpreted.length > 0,
    },
    rulesetVersion: '1.0.0',
    contentVersion: '2026.11',
  };
}

/**
 * 針對全盤十二宮進行完整解析，回傳以 branchIndex 為鍵值的解讀集合與陣列
 * @param {Object} chart calculateZiweiChart 產出之完整星盤
 * @returns {{ list: Array<Object>, byBranch: Object<number, Object> }}
 */
function analyzePalaceInterpretations(chart) {
  if (!chart || !Array.isArray(chart.palaces)) {
    return { list: [], byBranch: {} };
  }

  const list = [];
  const byBranch = {};

  for (let i = 0; i < chart.palaces.length; i++) {
    const interpretation = interpretPalace(chart, i);
    if (interpretation) {
      list.push(interpretation);
      byBranch[interpretation.branchIndex] = interpretation;
    }
  }

  return { list, byBranch };
}

module.exports = {
  BRIGHTNESS_DEFINITIONS,
  MAJOR_STARS_META,
  SIHUA_DEFINITIONS,
  MINOR_STARS_META,
  PALACE_THEMES,
  COMBINATION_RULES,
  interpretPalace,
  analyzePalaceInterpretations,
};
