/* 2026 高加索行程 · 前端逻辑
   无构建步骤：数据 + 渲染 + 本机存储（可选三人同步） */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ============================================================
   1. 数据
   ============================================================ */

const MEMBERS = ['BOFAN', 'NIKKI', 'PEIZHEN'];

const ROUTE = ['上海 / 北京', '西安', '阿克套', '巴库', '第比利斯', '梅斯蒂亚', '乌树故里', '埃里温', '莫斯科'];

const CITIES = [
  { id: 'aktau',   cn: '阿克套',   stay: '2 晚',     lon: 51.1662, lat: 43.6411 },
  { id: 'baku',    cn: '巴库',     stay: '2 晚',     lon: 49.8671, lat: 40.4093 },
  { id: 'tbilisi', cn: '第比利斯', stay: '2 段停留', lon: 44.8271, lat: 41.7151 },
  { id: 'mestia',  cn: '梅斯蒂亚', stay: '徒步起点', lon: 42.7261, lat: 43.0456 },
  { id: 'ushguli', cn: '乌树故里', stay: '当日往返', lon: 43.0167, lat: 42.9167 },
  { id: 'yerevan', cn: '埃里温',   stay: '2 晚',     lon: 44.4991, lat: 40.1792 }
];

/* 行程中的 8 段交通（最后一段为返程航班，向东飞出图外） */
const LEGS = [
  { from: 'aktau',   to: 'baku',    mode: '飞机',         label: 'J28216' },
  { from: 'baku',    to: 'tbilisi', mode: '夜火车',       label: '23:10 发车' },
  { from: 'tbilisi', to: 'mestia',  mode: '小飞机 / 包车', label: 'Vanilla Sky' },
  { from: 'mestia',  to: 'ushguli', mode: '徒步',         label: '3 天' },
  { from: 'ushguli', to: 'tbilisi', mode: '包车',         label: '当日返回' },
  { from: 'tbilisi', to: 'yerevan', mode: '包车',         label: '约 5 小时' },
  { from: 'yerevan', to: 'moscow',  mode: '飞机',         label: 'SU1967' }
];

/* 手绘地图：交通方式 → 线型样式 */
const MAP_MODE_CLASS = { '飞机': 'plane', '夜火车': 'train', '小飞机 / 包车': 'plane', '徒步': 'trek', '包车': 'car' };
const MAP_DASH = { plane: null, train: '12 8', car: '16 10', trek: '2 9' };
const MAP_SHORT_LABEL = { '飞机': '飞机', '夜火车': '夜火车', '小飞机 / 包车': '小飞机', '徒步': '徒步', '包车': '包车' };

const STATUS = {
  ok: { cls: 'status-ok', text: '已出票' },
  booked: { cls: 'status-ok', text: '已预订' },
  wait: { cls: 'status-wait', text: '待确认' },
  todo: { cls: 'status-todo', text: '待预定' }
};

const DAYS = [
  {
    n: 1, date: '09/25', weekday: '周五', from: '上海 / 北京', to: '西安',
    title: '上海 / 北京 → 西安',
    img: null,
    summary: '两人分别飞往西安，当晚在机场附近或航站楼内休息，次日清晨同一个航站楼转机。',
    tags: [{ t: '中转日', k: 'accent' }],
    transit: [
      { mode: '飞机', detail: 'MU2193 上海浦东 T1 → 西安咸阳 T5 · MU2124 北京大兴 → 西安咸阳 T5', time: '21:30 / 23:00 起飞', status: 'ok' }
    ],
    stay: { name: '西安咸阳机场附近或机场内', addr: '待定', status: 'todo' },
    open: '转机日，没有场馆安排。',
    notes: ['次日 06:00 的 DV782 仍在 T5，转机约 4 小时，不要出机场太远。']
  },
  {
    n: 2, date: '09/26', weekday: '周六', from: '西安', to: '阿克套',
    title: '西安 → 奇姆肯特 → 阿克套',
    img: null,
    summary: '经奇姆肯特转机抵达里海边的阿克套，落地后先休息，晚上不安排行程。',
    tags: [{ t: '入境哈萨克斯坦', k: 'accent' }, { t: '落地休息', k: '' }],
    transit: [
      { mode: '飞机', detail: 'DV782 西安咸阳 T5 → 奇姆肯特 · 转 DV709 → 阿克套', time: '06:00 — 14:00', status: 'ok' },
      { mode: '打车', detail: '机场 → 市区住宿', time: '约 30 分钟', status: 'todo' }
    ],
    stay: { name: '阿克套市区住宿', addr: '待定', status: 'todo' },
    sights: [{ cn: '里海海滨步道', en: 'Caspian embankment', note: '傍晚散步' }],
    open: '当天以休息为主。阿克套比北京时间晚 3 小时，落地后按当地作息走。',
    notes: ['入境时保留入境章与移民卡，住宿登记单也留一份。']
  },
  {
    n: 3, date: '09/27', weekday: '周日', from: '阿克套', to: '曼吉斯陶',
    title: '阿克套 · 曼吉斯陶一日游',
    img: null,
    summary: '从里海出发，进入白垩地貌与峡谷构成的荒原，一天走完曼吉斯陶最经典的几处景观。',
    tags: [{ t: '需提前预订', k: 'warn' }, { t: '全天 · 22:00 返回', k: '' }],
    transit: [
      { mode: '一日游巴士', detail: 'Turan Residence / Hide coffee shop 前集合', time: '06:45 集合 · 07:00 出发', status: 'wait' }
    ],
    sights: [
      { cn: '上博兹吉拉', en: 'Upper Bozzhyra', note: '' },
      { cn: '克孜勒库普', en: 'Kyzylkup', note: '条纹山体' },
      { cn: '伊比克特峡谷', en: 'Ybykty Canyon', note: '' },
      { cn: '卡拉曼阿塔', en: 'Karaman Ata', note: '地下清真寺' },
      { cn: '火星全景', en: 'Mars panorama', note: '' }
    ],
    open: '全部为户外地貌，没有门票与闭馆限制。',
    notes: ['带水 1–2 升、零食与防晒；清真寺着装得体。', '荒漠区信号差，提前下载离线地图。']
  },
  {
    n: 4, date: '09/28', weekday: '周一', from: '阿克套', to: '巴库',
    title: '阿克套 → 巴库 · 老城与里海',
    img: null,
    summary: '凌晨飞越里海，上午补觉，下午用老城与日落游船慢慢进入巴库。',
    tags: [{ t: '凌晨航班', k: '' }, { t: '入境阿塞拜疆', k: 'accent' }],
    transit: [
      { mode: '飞机', detail: 'J28216 阿克套 → 巴库（以下均为巴库当地时间，比阿克套晚 1 小时）', time: '02:55 — 约 04:00', status: 'ok' },
      { mode: '市内', detail: '机场打车进城 · 傍晚里海游船（建议日落场）', time: '—', status: 'todo' }
    ],
    stay: { name: '巴库市区住宿', addr: '待定', status: 'todo' },
    sights: [
      { cn: '巴库老城', en: 'İçərişəhər', note: '世界遗产' },
      { cn: '少女塔', en: 'Maiden Tower', note: '' },
      { cn: '希尔万沙宫', en: "Shirvanshah's Palace", note: '' }
    ],
    open: '老城是露天街区，全天可逛；宫内展馆的开放时间以现场公示为准。',
    notes: ['入境时避免携带有亚美尼亚符号的物品。', '现金申报规则出发前复核。']
  },
  {
    n: 5, date: '09/29', weekday: '周二', from: '巴库', to: '夜火车 → 第比利斯',
    title: '巴库游览 · 夜火车出境',
    img: null,
    summary: '白天看现代的巴库，晚上退房上车，一觉睡到第比利斯。',
    tags: [{ t: '需提前购票 · 夜火车', k: 'warn' }, { t: '明早三人会合', k: 'accent' }],
    transit: [
      { mode: '市内', detail: '火焰塔、黑达尔阿利耶夫中心、海滨大道、国旗广场', time: '白天', status: 'todo' },
      { mode: '夜火车', detail: '巴库 → 第比利斯 · 9 号车厢 Luxury', time: '23:10 发车', status: 'wait' }
    ],
    stay: { name: '夜火车卧铺', addr: '车厢 9 · Luxury', status: 'wait' },
    sights: [
      { cn: '火焰塔', en: 'Flame Towers', note: '' },
      { cn: '黑达尔阿利耶夫中心', en: 'Heydar Aliyev Center', note: '周一闭馆' },
      { cn: '戈布斯坦岩画（备选）', en: 'Gobustan', note: '需要半天' }
    ],
    open: '黑达尔阿利耶夫中心周一闭馆，周二人正常开放。',
    notes: ['PEIZHEN 今晚 21:05 独自抵达第比利斯，先在住处休息。', '夜火车要提前订票并确认车厢等级。']
  },
  {
    n: 6, date: '09/30', weekday: '周三', from: '第比利斯', to: '第比利斯',
    title: '第比利斯 · City Walk',
    img: null,
    summary: '三人重新汇合，一整天用脚步走完旧城、河谷与山上的要塞。',
    tags: [{ t: '三人会合', k: 'accent' }, { t: '步行日', k: '' }],
    transit: [
      { mode: '步行 / 缆车', detail: '自由广场 → Rustaveli → 老城 → 和平桥 → 梅特希 → 圣三一 → 纳里卡拉', time: '全天', status: 'todo' }
    ],
    stay: { name: '第比利斯住宿', addr: '待定', status: 'todo' },
    sights: [
      { cn: '和平桥', en: 'Bridge of Peace', note: '' },
      { cn: '梅特希教堂', en: 'Metekhi Church', note: '' },
      { cn: '圣三一主教座堂', en: 'Sameba Cathedral', note: '' },
      { cn: '纳里卡拉要塞', en: 'Narikala Fortress', note: '缆车上山' },
      { cn: '硫磺浴', en: 'Abanotubani', note: '晚上' },
      { cn: '旱桥市场 / 国家博物馆', en: 'Dry Bridge / National Museum', note: '二选一' }
    ],
    open: '格鲁吉亚国家博物馆周一闭馆，周三正常开放。',
    notes: ['BOFAN、NIKKI 乘夜火车 08:41 抵达，直接开始当天行程。', '晚餐可选 Kakhelebi 或 Sakhli 1904。', '缆车与硫磺浴周末排队久，尽量避开高峰。']
  },
  {
    n: 7, date: '10/01', weekday: '周四', from: '第比利斯', to: 'Zhabeshi',
    title: '第比利斯 → 梅斯蒂亚 · 徒步第 1 天',
    img: null,
    summary: '主方案用香草航空衔接梅斯蒂亚，午后开始徒步第一段。',
    tags: [{ t: '需提前购票 · 小飞机', k: 'warn' }, { t: '徒步 14.5–16 km', k: '' }],
    transit: [
      { mode: '小飞机', detail: 'Vanilla Sky · Natakhtari → Mestia / Kutaisi', time: '以实际出票为准', status: 'wait' },
      { mode: '徒步', detail: 'Mestia → Zhabeshi', time: '约 5–6 小时', status: 'todo' }
    ],
    stay: { name: 'Zhabeshi 民宿', addr: '待定', status: 'todo' },
    sights: [{ cn: '斯瓦涅季石塔', en: 'Svan towers', note: '沿途可见' }],
    open: '徒步路线全天开放，无需门票。',
    notes: [
      '备选方案：没有小飞机时改为第比利斯 → Zugdidi（火车）→ Mestia（小巴），当日住梅斯蒂亚。',
      '离线地图必须提前下载。'
    ]
  },
  {
    n: 8, date: '10/02', weekday: '周五', from: 'Zhabeshi', to: 'Adishi',
    title: '徒步第 2 天 · Zhabeshi → Adishi',
    img: null,
    summary: '穿过村落与山谷，这一天路程不长，但补给点少。',
    tags: [{ t: '徒步 10–11.5 km', k: '' }, { t: '部分路段无信号', k: 'warn' }],
    transit: [{ mode: '徒步', detail: 'Zhabeshi → Adishi', time: '约 4–5 小时', status: 'todo' }],
    stay: { name: 'Adishi 民宿', addr: '待定', status: 'todo' },
    open: '徒步路线全天开放。',
    notes: ['Adishi → Iprali 一带约 9 km 没有信号。', '到 Khalde 村才有吃喝，出发前带足水和干粮。']
  },
  {
    n: 9, date: '10/03', weekday: '周六', from: 'Adishi', to: '第比利斯',
    title: '徒步第 3 天 → 乌树故里',
    img: null,
    summary: '上午走到 Iprali 后包车进乌树故里，傍晚直接返回第比利斯。',
    tags: [{ t: '徒步 + 包车', k: '' }, { t: '包车待预定', k: 'warn' }],
    transit: [
      { mode: '徒步', detail: 'Adishi → Iprali', time: '约 4 小时', status: 'todo' },
      { mode: '包车', detail: 'Iprali → 乌树故里', time: '约 1 小时', status: 'todo' },
      { mode: '包车', detail: '乌树故里 → 第比利斯', time: '夜间 · 约 6 小时', status: 'todo' }
    ],
    stay: { name: '第比利斯住宿', addr: '待定', status: 'todo' },
    sights: [
      { cn: '乌树故里村', en: 'Ushguli', note: '海拔约 2,100 m' },
      { cn: '什哈拉雪山观景', en: 'Mt. Shkhara view', note: '' }
    ],
    open: '全天开放，没有门票。',
    notes: ['两段包车都要提前谈好价格与时间。', '回第比利斯的夜路较长，确认司机是否接受夜行。']
  },
  {
    n: 10, date: '10/04', weekday: '周日', from: '第比利斯', to: '埃里温',
    title: '第比利斯 → 埃里温',
    img: null,
    summary: '白天补足第比利斯，夜里包车过境前往埃里温。',
    tags: [{ t: '过境日', k: 'accent' }, { t: '包车约 5 小时', k: 'warn' }],
    transit: [
      { mode: '步行', detail: '第比利斯自由活动，或 Didgori Battle Memorial', time: '白天', status: 'todo' },
      { mode: '包车', detail: '第比利斯 → 埃里温（经边境）', time: '夜间 · 约 5 小时', status: 'todo' }
    ],
    stay: { name: '埃里温住宿', addr: '待定', status: 'todo' },
    sights: [{ cn: '德贝德河谷', en: 'Debed River Gorge', note: '沿途' }],
    open: '过境日，注意口岸开放时间。',
    notes: ['护照随身，确认包车能否直接过境。', '入境亚美尼亚后的现金申报规则出发前复核。']
  },
  {
    n: 11, date: '10/05', weekday: '周一', from: '埃里温', to: '埃里温',
    title: '埃里温全天',
    img: null,
    summary: '从纪念空间走到粉色凝灰岩阶梯，晚上在葡萄酒街收尾。',
    tags: [{ t: '周一 · 部分场馆闭馆', k: 'danger' }, { t: '城市日', k: '' }],
    transit: [{ mode: '打车 / 步行', detail: '埃里温城区内移动', time: '全天', status: 'todo' }],
    stay: { name: '埃里温住宿', addr: '待定', status: 'todo' },
    sights: [
      { cn: '亚美尼亚种族灭绝博物馆', en: 'Tsitsernakaberd', note: '周一闭馆' },
      { cn: '圣萨尔基斯大教堂', en: 'St. Sarkis Cathedral', note: '' },
      { cn: '蓝色清真寺', en: 'Blue Mosque', note: '' },
      { cn: '共和国广场 · 埃里温大教堂', en: 'Republic Square', note: '' },
      { cn: '阶梯广场', en: 'Cascade', note: '全天开放' },
      { cn: '马特纳达兰', en: 'Matenadaran', note: '周一闭馆' },
      { cn: 'Vernissage 市场', en: 'Vernissage Market', note: '周末最热闹' }
    ],
    open: '种族灭绝博物馆与马特纳达兰周一闭馆（以官网为准）；阶梯、共和国广场与教堂全天可去。',
    notes: ['如果一定要进馆，可以把这两处挪到 10/04 傍晚抵达后，或放弃其中一处。', 'Saryan 街适合晚上散步。']
  },
  {
    n: 12, date: '10/06', weekday: '周二', from: '埃里温', to: '莫斯科 → 上海 / 北京',
    title: '埃里温 → 莫斯科 → 返程',
    img: null,
    summary: '长途中转日：红场周边半日，晚班机分别飞上海与北京。',
    tags: [{ t: '长途中转', k: '' }, { t: '俄罗斯免签', k: 'ok' }],
    transit: [
      { mode: '飞机', detail: 'SU1967 / FV1967 埃里温 → 莫斯科（莫斯科时间）', time: '06:45 — 08:55', status: 'ok' },
      { mode: '机场快线', detail: '谢列梅捷沃 → 市区（如出中转区）', time: '约 1 小时', status: 'todo' },
      { mode: '飞机', detail: 'FV208 莫斯科 → 上海浦东 T2 · SU204 莫斯科 → 北京大兴', time: '20:00 / 21:05 起飞', status: 'ok' }
    ],
    sights: [
      { cn: '红场 · 无名烈士墓', en: 'Red Square', note: '' },
      { cn: 'GUM 百货', en: 'GUM', note: '10:00–22:00' },
      { cn: '扎里亚季耶公园', en: 'Zaryadye Park', note: '' },
      { cn: '米宁与波扎尔斯基雕像', en: 'Minin & Pozharsky', note: '' }
    ],
    open: '红场与无名烈士墓全天开放；GUM 10:00–22:00；博物馆类场馆多周一闭馆，周二人正常。',
    notes: [
      '中国普通护照赴俄免签，省去签证准备；入境事由与停留天数按出发前官方公告确认。',
      '如出中转区，现场填写纸质移民卡并保管 B 联。',
      '以上时间均为当地时间，回程抵达 09:50 为北京时间。中转约 11 小时，留足值机时间。'
    ]
  },
  {
    n: 13, date: '10/07', weekday: '周三', from: '上海 / 北京', to: '抵达',
    title: '抵达国内',
    img: null,
    summary: '旅行结束，三人分别回到上海与北京。',
    tags: [{ t: '行程结束', k: 'ok' }],
    transit: [
      { mode: '抵达', detail: '上海浦东 T2 · 北京大兴（北京时间）', time: '09:50', status: 'ok' }
    ],
    open: '—',
    notes: []
  }
];

const CHECKLIST = [
  {
    name: '证件与文件',
    items: [
      { t: '护照' },
      { t: '全程机票订单', n: '英文版' },
      { t: '酒店订单' },
      { t: '格鲁吉亚医疗保险单' },
      { t: '徒步团 / 包车确认单' },
      { t: '俄罗斯移民卡', n: '飞机上或边检前填写' },
      { t: '现金申报单', n: '如携带超限现金' }
    ]
  },
  {
    name: '现金与支付',
    items: [
      { t: '美元现金' },
      { t: '当地货币', n: '少量' },
      { t: 'VISA / Mastercard 信用卡' },
      { t: '银联卡' },
      { t: '小面额美元' }
    ]
  },
  {
    name: '徒步装备',
    items: [
      { t: '高帮防水徒步鞋' },
      { t: '硬壳冲锋衣' },
      { t: '抓绒衣' },
      { t: '排骨羽绒服' },
      { t: '速干内搭', n: '羊毛底和普通速干' },
      { t: '速干长裤' },
      { t: '保暖帽、手套' },
      { t: '羊毛袜' },
      { t: '登山杖' },
      { t: '过河凉鞋 / 拖鞋' },
      { t: '雨衣' },
      { t: '防晒霜、遮阳帽' },
      { t: '头灯 / 手电' },
      { t: '水壶 / 水袋' },
      { t: '离线地图' },
      { t: '徒步包托运袋' }
    ]
  },
  {
    name: '日常衣物',
    items: [
      { t: '城市休闲长裤' },
      { t: '短袖 / 长袖 T 恤' },
      { t: '薄外套' },
      { t: '内衣裤' },
      { t: '睡衣' },
      { t: '舒适运动鞋' },
      { t: '围巾' }
    ]
  },
  {
    name: '电子设备',
    items: [
      { t: '手机 + 充电器' },
      { t: '充电宝', n: '随身携带' },
      { t: '转换插头' },
      { t: '相机 + 备用电池' },
      { t: 'eSIM' },
      { t: '本地电话卡', n: '备用' }
    ]
  },
  {
    name: '药品与急救',
    items: [
      { t: '个人常用药' },
      { t: '感冒药、退烧药' },
      { t: '肠胃药、止泻药' },
      { t: '创可贴、消毒湿巾' },
      { t: '高原反应药', n: '如需要' },
      { t: '防蚊液' },
      { t: '晕车药' }
    ]
  },
  {
    name: '其他',
    items: [
      { t: '随身小包', n: '徒步时用' },
      { t: '折叠水杯' },
      { t: '零食 / 能量棒' },
      { t: '纸巾 / 湿巾' },
      { t: '免洗洗手液' },
      { t: '旅行枕' },
      { t: '耳塞、眼罩' }
    ]
  }
];

const APPS = [
  { name: '打车', items: [
    { t: 'Yandex Go', n: '哈萨克斯坦 / 亚美尼亚 / 俄罗斯' },
    { t: 'Bolt', n: '阿塞拜疆 / 格鲁吉亚' },
    { t: 'GG Taxi', n: '亚美尼亚' }
  ] },
  { name: '翻译', items: [
    { t: 'Google Translate', n: '提前下载离线包' },
    { t: 'Yandex Translate' }
  ] },
  { name: '包车', items: [
    { t: 'GoTrip', url: 'https://gotrip.ge/' },
    { t: 'Daytrip', url: 'https://daytrip.com/' },
    { t: 'GetYourGuide', url: 'https://getyourguide.com/' }
  ] },
  { name: '铁路', items: [
    { t: 'ADY', n: '阿塞拜疆铁路', url: 'https://ady.az/' }
  ] },
  { name: '小飞机', items: [
    { t: 'Vanilla Sky', url: 'https://ticket.vanillasky.ge/' }
  ] },
  { name: '地图', items: [
    { t: 'Google Maps' }
  ] },
  { name: '汇率', items: [
    { t: 'XE Currency' }
  ] },
  { name: '天气', items: [
    { t: 'Windy' }
  ] }
];

const SAFETY = [
  { h: '旅行保险', b: '含紧急救援的旅行保险单', li: ['纸质与手机离线副本各留一份', '保单号与救援电话存在手机备忘录'] },
  { h: '领事保护', b: '中国外交部全球领事保护热线', li: ['+86-10-12308', '境外拨打时前面加当地国际接入码'] },
  { h: '各国紧急电话', b: '报警 / 急救', li: [
    ['哈萨克斯坦', '102 / 103'],
    ['阿塞拜疆', '102 / 103'],
    ['格鲁吉亚', '112'],
    ['亚美尼亚', '112'],
    ['俄罗斯', '112']
  ] },
  { h: '使领馆', b: '中国驻当地使馆', li: ['阿塞拜疆 · 巴库', '格鲁吉亚 · 第比利斯', '亚美尼亚 · 埃里温', '俄罗斯 · 莫斯科'], n: '出发前把号码存进手机' },
  { h: '离线准备', b: '没有网络时也要查得到', li: ['离线地图：斯瓦涅季、曼吉斯陶', '护照与保单照片存在本机', '翻译 App 离线包'] }
];

const CREDITS = [
  ['头图 · 曼吉斯陶博兹吉拉山谷', 'CC BY-SA 4.0', 'Berik Aday（Wikimedia Commons）']
];

const DEFAULT_RATES = { KZT: 0.0145, AZN: 4.2, GEL: 2.65, AMD: 0.0185, RUB: 0.088, USD: 7.1, CNY: 1 };
const CURRENCY_NAMES = {
  KZT: '哈萨克斯坦坚戈', AZN: '阿塞拜疆马纳特', GEL: '格鲁吉亚拉里',
  AMD: '亚美尼亚德拉姆', RUB: '俄罗斯卢布', USD: '美元', CNY: '人民币'
};

/* ============================================================
   2. 本机存储
   ============================================================ */

const STORE = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn('读取失败', key, err);
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('保存失败', key, err);
    }
  }
};

const KEY = {
  expenses: 'cg26.expenses',
  rates: 'cg26.rates',
  ratesAt: 'cg26.ratesAt',
  checks: 'cg26.checks',
  openGroups: 'cg26.openGroups',
  person: 'cg26.person',
  sync: 'cg26.sync',
  theme: 'cg26.theme'
};

/* ============================================================
   3. 外观模式：自动 / 浅色 / 深色
   ============================================================ */

const THEME_LABEL = { auto: '自动', light: '浅色', dark: '深色' };
let themeMode = STORE.read(KEY.theme, 'auto');

/** 自动模式跟随系统，但最终都落成明确的 light / dark，样式表里只留一份深色变量 */
function resolveTheme(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode) {
  themeMode = mode;
  document.documentElement.setAttribute('data-theme', resolveTheme(mode));
  const btn = $('#theme-toggle');
  if (btn) btn.textContent = THEME_LABEL[mode];
  STORE.write(KEY.theme, mode);
}

applyTheme(themeMode);

$('#theme-toggle').addEventListener('click', () => {
  applyTheme(themeMode === 'auto' ? 'light' : themeMode === 'light' ? 'dark' : 'auto');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (themeMode === 'auto') applyTheme('auto');
});

/* ============================================================
   4. 通用工具
   ============================================================ */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const money = (n) => '¥ ' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function statusChip(key) {
  const s = STATUS[key] || STATUS.todo;
  return '<span class="status ' + s.cls + '">' + s.text + '</span>';
}

/* 头图路线标签 */
$('#hero-route').innerHTML = ROUTE.map((c) => '<li>' + c + '</li>').join('');

/* ============================================================
   5. 总览地图：手绘路线示意（纯本地渲染，不依赖网络）
   ============================================================ */

/* 视角：宽屏横向、窄屏略收。底图是真国界与海域，来自同目录的 map-geo.js（Natural Earth 1:50m） */
const MAP_LAYOUT = {
  wide: {
    w: 1000, h: 760,
    box: [39.2, 38.6, 54.8, 45.8],
    fs: { city: 18, stay: 12.5, leg: 14, note: 12, country: 19, sea: 17, brd: 1.1, node: 4.6, ring: 5 },
    sides: { aktau: 'left', baku: 'right', tbilisi: 'right', mestia: 'left', ushguli: 'right', yerevan: 'bottom' },
    legOff: { 'aktau|baku': 20, 'baku|tbilisi': 20, 'tbilisi|mestia': 22, 'mestia|ushguli': 44,
              'ushguli|tbilisi': -24, 'tbilisi|yerevan': 18, 'yerevan|moscow': 20 },
    countries: [
      { t: '俄罗斯', lon: 43.7, lat: 45.29 },
      { t: '哈萨克斯坦', lon: 53.6, lat: 44.1 },
      { t: '格鲁吉亚', lon: 41.8, lat: 42.3 },
      { t: '亚美尼亚', lon: 45.4, lat: 40.5 },
      { t: '阿塞拜疆', lon: 47.2, lat: 40.39 },
      { t: '土耳其', lon: 40.3, lat: 39.0 },
      { t: '伊朗', lon: 46.5, lat: 38.9 }
    ],
    seas: [
      { t: '里海', lon: 50.5, lat: 42.5 },
      { t: '黑海', lon: 40.2, lat: 43.2 }
    ],
    hideLegLabels: ['tbilisi|mestia', 'mestia|ushguli', 'ushguli|tbilisi']
  },
  narrow: {
    w: 560, h: 560,
    box: [40.0, 38.6, 52.6, 46.2],
    fs: { city: 20, stay: 14, leg: 15.5, note: 13, country: 16, sea: 15, brd: 1.3, node: 5, ring: 5.5 },
    sides: { aktau: 'left', baku: 'right', tbilisi: 'right', mestia: 'left', ushguli: 'right', yerevan: 'bottom' },
    legOff: { 'aktau|baku': 16, 'baku|tbilisi': 26, 'tbilisi|mestia': 18, 'mestia|ushguli': 34,
              'ushguli|tbilisi': -20, 'tbilisi|yerevan': 16, 'yerevan|moscow': 16 },
    countries: [
      { t: '俄罗斯', lon: 43.7, lat: 45.29 },
      { t: '哈萨克斯坦', lon: 51.4, lat: 45.3 },
      { t: '格鲁吉亚', lon: 41.8, lat: 42.3 },
      { t: '亚美尼亚', lon: 45.4, lat: 40.5 },
      { t: '阿塞拜疆', lon: 47.2, lat: 40.39 },
      { t: '土耳其', lon: 40.9, lat: 39.3 },
      { t: '伊朗', lon: 46.5, lat: 38.9 }
    ],
    seas: [
      { t: '里海', lon: 50.7, lat: 42.7 }
    ],
    hideLegLabels: ['tbilisi|mestia', 'mestia|ushguli', 'ushguli|tbilisi']
  }
};

/* 莫斯科在图外（正北方向），单独做指引 */
const MOSCOW = { cn: '莫斯科', stay: '中转半日', lon: 37.6173, lat: 55.7558 };

const SVG_NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs, text) => {
  const node = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs || {}).forEach((k) => node.setAttribute(k, attrs[k]));
  if (text != null) node.textContent = text;
  return node;
};

/** 墨卡托投影的 y 分量 */
function mercatorY(lat) {
  const clamped = Math.max(-85, Math.min(85, lat));
  return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI / 180) / 2));
}

/** 把一块经纬度范围等比装进画布，居中留白 */
function makeProjection(box, w, h) {
  const minLon = box[0];
  const minLat = box[1];
  const maxLon = box[2];
  const maxLat = box[3];
  const xSpan = (maxLon - minLon) * Math.PI / 180;
  const yTop = mercatorY(maxLat);
  const ySpan = yTop - mercatorY(minLat);
  const scale = Math.min(w / xSpan, h / ySpan);
  const offsetX = (w - xSpan * scale) / 2;
  const offsetY = (h - ySpan * scale) / 2;
  return {
    scale: scale,
    x: (lon) => offsetX + (lon - minLon) * Math.PI / 180 * scale,
    y: (lat) => offsetY + (yTop - mercatorY(lat)) * scale
  };
}

/** 把一圈圈经纬度转成 SVG 路径 */
function geoPath(rings, proj) {
  return rings.map((ring) => 'M' + ring.map((pt) =>
    proj.x(pt[0]).toFixed(1) + ' ' + proj.y(pt[1]).toFixed(1)).join('L') + 'Z').join('');
}

function renderRouteMap() {
  const box = $('#route-map');
  if (!box) return;
  if (typeof MAP_GEO === 'undefined') {
    box.innerHTML = '<p class="hint" style="padding:16px">地图数据 map-geo.js 未加载。</p>';
    return;
  }
  const narrow = box.clientWidth > 0 && box.clientWidth < 640;
  const L = narrow ? MAP_LAYOUT.narrow : MAP_LAYOUT.wide;
  const proj = makeProjection(L.box, L.w, L.h);
  const pos = {};
  CITIES.forEach((city) => { pos[city.id] = { x: proj.x(city.lon), y: proj.y(city.lat) }; });
  const moscow = { x: proj.x(MOSCOW.lon), y: proj.y(MOSCOW.lat) };

  box.innerHTML = '';
  const svg = svgEl('svg', {
    viewBox: '0 0 ' + L.w + ' ' + L.h,
    role: 'img',
    'aria-label': '高加索行程地图：真实国界底图，标出阿克套、巴库、第比利斯、梅斯蒂亚、乌树故里、埃里温，以及图外的莫斯科方向'
  });

  /* 底图三层：海面底色 → 陆地（含国界描边）→ 湖泊与内海 */
  svg.appendChild(svgEl('rect', { class: 'hm-sea-bg', x: 0, y: 0, width: L.w, height: L.h }));
  MAP_GEO.countries.forEach((country) => {
    svg.appendChild(svgEl('path', {
      class: 'hm-land', 'fill-rule': 'evenodd', 'stroke-width': L.fs.brd,
      d: geoPath(country.rings, proj)
    }));
  });
  MAP_GEO.water.forEach((water) => {
    svg.appendChild(svgEl('path', { class: 'hm-water', d: geoPath(water.rings, proj) }));
  });

  /* 国名与海域名 */
  L.countries.forEach((c) => {
    svg.appendChild(svgEl('text', {
      class: 'hm-country-label', 'text-anchor': 'middle',
      'font-size': L.fs.country, 'letter-spacing': (L.fs.country * 0.1).toFixed(1),
      x: proj.x(c.lon).toFixed(1), y: proj.y(c.lat).toFixed(1)
    }, c.t));
  });
  L.seas.forEach((s) => {
    svg.appendChild(svgEl('text', {
      class: 'hm-sea-label', 'text-anchor': 'middle',
      'font-size': L.fs.sea, 'letter-spacing': (L.fs.sea * 0.14).toFixed(1),
      x: proj.x(s.lon).toFixed(1), y: proj.y(s.lat).toFixed(1)
    }, s.t));
  });

  /* 交通连线 */
  LEGS.forEach((leg) => {
    if (!pos[leg.to] || !pos[leg.from]) return;   /* 莫斯科在图外，单独画 */
    const a = pos[leg.from];
    const b = pos[leg.to];
    const key = leg.from + '|' + leg.to;
    const mode = MAP_MODE_CLASS[leg.mode] || 'car';
    const path = svgEl('path', {
      class: 'route-line hm-r-' + mode,
      d: 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'L' + b.x.toFixed(1) + ' ' + b.y.toFixed(1)
    });
    if (MAP_DASH[mode]) path.setAttribute('stroke-dasharray', MAP_DASH[mode]);
    svg.appendChild(path);

    /* 斯瓦涅季一带太密：这三段不在地图上单独标注，线型由图例说明 */
    if (L.hideLegLabels.indexOf(key) >= 0) return;

    /* 交通方式标在连线中点的垂直方向；短路段用细引线拉出来 */
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const off = L.legOff[leg.from + '|' + leg.to] || 18;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const lx = mx + nx * off;
    const ly = my + ny * off;
    if (Math.abs(off) > 26) {
      svg.appendChild(svgEl('path', {
        class: 'hm-leader',
        d: 'M' + mx.toFixed(1) + ' ' + my.toFixed(1) + 'L' + lx.toFixed(1) + ' ' + ly.toFixed(1)
      }));
    }
    svg.appendChild(svgEl('text', {
      class: 'hm-lbl hm-lbl-' + mode, 'text-anchor': 'middle',
      x: lx.toFixed(1), y: (ly + 5).toFixed(1)
    }, MAP_SHORT_LABEL[leg.mode] || leg.mode));
  });

  /* 莫斯科在图外：从埃里温引一条虚线指向图外 */
  const yerevan = pos.yerevan;
  const ratio = (0 - yerevan.y) / (moscow.y - yerevan.y);
  const exitX = Math.max(30, Math.min(L.w - 30, yerevan.x + (moscow.x - yerevan.x) * ratio));
  svg.appendChild(svgEl('path', {
    class: 'route-line hm-r-plane', 'stroke-dasharray': '5 8', opacity: '.65',
    d: 'M' + yerevan.x.toFixed(1) + ' ' + yerevan.y.toFixed(1) + 'L' + exitX.toFixed(1) + ' 0'
  }));
  const exitAnchor = exitX > L.w - 280 ? 'end' : 'start';
  svg.appendChild(svgEl('text', {
    class: 'hm-lbl hm-lbl-plane', 'text-anchor': exitAnchor,
    x: (exitX + (exitAnchor === 'end' ? -12 : 12)).toFixed(1), y: 28
  }, '↑ 莫斯科 · 中转半日（图外）'));

  /* 城市节点 */
  CITIES.forEach((city) => {
    const p = pos[city.id];
    svg.appendChild(svgEl('circle', { class: 'hm-ring', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: (L.fs.node + 3.5).toFixed(1) }));
    svg.appendChild(svgEl('circle', { class: 'hm-node', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: L.fs.node }));

    const side = L.sides[city.id] || 'right';
    const anchor = side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle';
    const dx = side === 'left' ? -20 : side === 'right' ? 20 : 0;
    const dy = side === 'top' ? -(L.fs.stay + 22) : side === 'bottom' ? L.fs.stay + 26 : 7;
    svg.appendChild(svgEl('text', {
      class: 'hm-city', x: (p.x + dx).toFixed(1), y: (p.y + dy).toFixed(1), 'text-anchor': anchor
    }, city.cn));
    svg.appendChild(svgEl('text', {
      class: 'hm-stay', x: (p.x + dx).toFixed(1), y: (p.y + dy + L.fs.stay + 3).toFixed(1), 'text-anchor': anchor
    }, city.stay));
  });

  svg.appendChild(svgEl('text', { class: 'hm-note', x: 18, y: L.h - 14 },
    '底图：Natural Earth 1:50m 国界 · 路线为行程示意'));
  svg.appendChild(svgEl('rect', {
    class: 'hm-frame', x: 5, y: 5, width: L.w - 10, height: L.h - 10, rx: 12
  }));
  box.appendChild(svg);
}

$('#map-legend').innerHTML = [
  '<span class="dot"></span>停留城市（含停留时间）',
  '<span class="dash plane"></span>飞机',
  '<span class="dash train"></span>夜火车',
  '<span class="dash car"></span>小飞机 / 包车',
  '<span class="dash trek"></span>徒步',
  '斯瓦涅季一带（第比利斯—梅斯蒂亚—乌树故里）线段密集，具体见逐日行程',
  '莫斯科在图外（正北），返程上海 / 北京也在图外'
].map((html) => '<li>' + html + '</li>').join('');

renderRouteMap();

let mapResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(mapResizeTimer);
  mapResizeTimer = setTimeout(renderRouteMap, 180);
});

/* ============================================================
   6. 逐日行程
   ============================================================ */

function buildDayPanel(day) {
  const parts = [];

  if (day.img) {
    parts.push(
      '<figure class="day-photo">' +
        '<img src="' + day.img.src + '" alt="' + day.img.cn + ' ' + day.img.en + '" loading="lazy" decoding="async">' +
        '<figcaption><b>' + day.img.cn + '</b> · ' + day.img.en + '</figcaption>' +
      '</figure>'
    );
  }

  if (day.tags && day.tags.length) {
    parts.push('<ul class="tags">' + day.tags.map((t) =>
      '<li class="tag' + (t.k ? ' tag-' + t.k : '') + '">' + t.t + '</li>').join('') + '</ul>');
  }

  parts.push('<p class="muted">' + day.summary + '</p>');

  if (day.transit && day.transit.length) {
    parts.push(
      '<div class="block"><h4>交通 · 当地时间</h4><div class="rows">' +
        day.transit.map((t) =>
          '<div class="row">' +
            '<div class="row-main">' +
              '<b>' + t.mode + (t.who ? ' · ' + t.who : '') + '</b>' +
              '<span>' + t.detail + '</span>' +
            '</div>' +
            '<div class="row-side">' +
              '<time>' + (t.time || '') + '</time>' +
              statusChip(t.status) +
            '</div>' +
          '</div>').join('') +
      '</div></div>'
    );
  }

  if (day.stay) {
    parts.push(
      '<div class="block"><h4>住宿</h4><div class="rows">' +
        '<div class="row">' +
          '<div class="row-main"><b>' + day.stay.name + '</b><span>' + day.stay.addr + '</span></div>' +
          '<div class="row-side">' + statusChip(day.stay.status) + '</div>' +
        '</div>' +
      '</div></div>'
    );
  }

  if (day.sights && day.sights.length) {
    parts.push(
      '<div class="block"><h4>景点 / 活动</h4><div class="rows">' +
        day.sights.map((s) =>
          '<div class="row"><div class="row-main">' +
            '<b>' + s.cn + ' <span class="muted">' + s.en + '</span></b>' +
            (s.note ? '<span>' + s.note + '</span>' : '') +
          '</div></div>').join('') +
      '</div></div>'
    );
  }

  if (day.open) {
    parts.push('<div class="block"><h4>当天开放情况</h4><p class="muted">' + day.open + '</p></div>');
  }

  if (day.notes && day.notes.length) {
    parts.push(
      '<div class="block"><h4>提醒</h4><div class="rows">' +
        day.notes.map((n) => '<div class="row"><div class="row-main"><span>' + n + '</span></div></div>').join('') +
      '</div></div>'
    );
  }

  const query = encodeURIComponent(day.from + ' ' + day.to + ' ' + day.title);
  parts.push(
    '<div class="day-actions">' +
      '<a class="btn" href="https://www.google.com/maps/search/?api=1&query=' + query + '" target="_blank" rel="noopener">在 Google Maps 中打开</a>' +
      '<button class="btn day-expense" type="button" data-date="2026-' + day.date.replace('/', '-') + '">＋ 记这一天的支出</button>' +
    '</div>'
  );

  return parts.join('');
}

function renderDays() {
  const list = $('#day-list');
  list.innerHTML = '';

  DAYS.forEach((day) => {
    const card = el('article', 'day');
    const panelId = 'day-' + day.n + '-panel';

    const heading = el('h3', 'day-heading');
    const toggle = el('button', 'day-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', panelId);
    toggle.innerHTML =
      '<span class="day-date">Day ' + day.n + '<br>' + day.date + ' · ' + day.weekday + '</span>' +
      '<span class="day-headline">' +
        '<span class="day-title">' + day.title + '</span>' +
        '<span class="day-summary">' + day.summary + '</span>' +
      '</span>' +
      '<span class="day-chev" aria-hidden="true">＋</span>';
    heading.appendChild(toggle);

    const panel = el('div', 'day-panel');
    panel.id = panelId;
    panel.hidden = true;
    panel.innerHTML = buildDayPanel(day);

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      toggle.querySelector('.day-chev').textContent = open ? '＋' : '−';
    });

    card.append(heading, panel);
    list.appendChild(card);
  });
}

$('#day-list').addEventListener('click', (event) => {
  const btn = event.target.closest('.day-expense');
  if (!btn) return;
  selectTab('entry');
  $('#exp-date').value = btn.dataset.date;
  $('#ledger').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#exp-amount').focus();
});

renderDays();

/* ============================================================
   7. 记账与结算
   ============================================================ */

let rates = Object.assign({}, DEFAULT_RATES, STORE.read(KEY.rates, {}));
let ratesUpdatedAt = STORE.read(KEY.ratesAt, 0);
let expenses = STORE.read(KEY.expenses, []);
let settleRateMode = 'record';
let editingId = null;
const splitState = { BOFAN: true, NIKKI: true, PEIZHEN: true };

function rateOf(code) {
  const r = Number(rates[code]);
  return Number.isFinite(r) && r > 0 ? r : 1;
}

/** 改过汇率就记一次时间戳，方便三人之间同步时判断谁更新 */
function saveRates() {
  ratesUpdatedAt = Date.now();
  STORE.write(KEY.rates, rates);
  STORE.write(KEY.ratesAt, ratesUpdatedAt);
  scheduleSync();
}

function rateFor(expense, mode) {
  if (mode === 'record') return Number(expense.rate) || rateOf(expense.currency);
  return rateOf(expense.currency);
}

function toCNY(expense, mode) {
  return Number(expense.amount) * rateFor(expense, mode || 'record');
}

function renderPayerOptions() {
  $('#exp-payer').innerHTML = MEMBERS.map((m) => '<option>' + m + '</option>').join('');
}

function renderCurrencyOptions() {
  const sel = $('#exp-currency');
  sel.innerHTML = Object.keys(DEFAULT_RATES).map((c) =>
    '<option value="' + c + '">' + c + ' · ' + CURRENCY_NAMES[c] + '</option>').join('');
  sel.value = 'KZT';
}

function renderMemberInputs() {
  const box = $('#member-split');
  const custom = document.querySelector('input[name="splitMode"]:checked').value === 'custom';
  box.innerHTML = MEMBERS.map((m) =>
    '<label class="member-chip">' +
      '<input type="checkbox" data-split="' + m + '"' + (splitState[m] ? ' checked' : '') + '>' +
      m +
      (custom ? '<input type="number" min="0" step="0.01" data-share="' + m + '" aria-label="' + m + ' 分摊金额">' : '') +
    '</label>').join('');

  box.onchange = (event) => {
    const target = event.target;
    if (target.dataset.split) splitState[target.dataset.split] = target.checked;
  };
}

function renderRateHint() {
  const currency = $('#exp-currency').value;
  const amount = Number($('#exp-amount').value);
  const hint = $('#rate-hint');
  if (!currency || !hint) return;
  if (!amount) {
    hint.textContent = '1 ' + currency + ' ≈ ¥ ' + rateOf(currency) + '（' + CURRENCY_NAMES[currency] + '）';
  } else {
    hint.textContent = amount + ' ' + currency + ' × ' + rateOf(currency) + ' = ' + money(amount * rateOf(currency));
  }
}

function renderRateGrid() {
  const grid = $('#rate-grid');
  grid.innerHTML = Object.keys(DEFAULT_RATES).map((c) =>
    '<label class="rate-item"><span>' + c + ' · ' + CURRENCY_NAMES[c] + '</span>' +
    '<input type="number" step="0.0001" min="0" data-rate="' + c + '" value="' + rateOf(c) + '"' +
    (c === 'CNY' ? ' disabled' : '') + '></label>').join('');

  grid.onchange = (event) => {
    const code = event.target.dataset.rate;
    if (!code) return;
    const value = Number(event.target.value);
    if (Number.isFinite(value) && value > 0) {
      rates[code] = value;
      saveRates();
      renderLedger();
      renderRateHint();
    }
  };
}

function settle(mode) {
  const paid = {};
  const owed = {};
  MEMBERS.forEach((m) => { paid[m] = 0; owed[m] = 0; });

  expenses.forEach((e) => {
    if (!(e.payer in paid)) return;
    const rate = rateFor(e, mode);
    const total = Number(e.amount) * rate;
    const people = e.shares ? Object.keys(e.shares) : e.split;
    if (!people || !people.length) return;
    paid[e.payer] += total;
    if (e.shares) {
      people.forEach((m) => { if (m in owed) owed[m] += Number(e.shares[m]) * rate; });
    } else {
      const each = total / people.length;
      people.forEach((m) => { if (m in owed) owed[m] += each; });
    }
  });

  const debtors = MEMBERS.map((m) => ({ name: m, value: paid[m] - owed[m] }))
    .filter((b) => b.value < -0.005).sort((a, b) => a.value - b.value);
  const creditors = MEMBERS.map((m) => ({ name: m, value: paid[m] - owed[m] }))
    .filter((b) => b.value > 0.005).sort((a, b) => b.value - a.value);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i].value, creditors[j].value);
    transfers.push({ from: debtors[i].name, to: creditors[j].name, amount });
    debtors[i].value += amount;
    creditors[j].value -= amount;
    if (Math.abs(debtors[i].value) < 0.005) i += 1;
    if (Math.abs(creditors[j].value) < 0.005) j += 1;
  }
  return { paid, owed, transfers };
}

function renderLedger() {
  STORE.write(KEY.expenses, expenses);

  const total = expenses.reduce((sum, e) => sum + toCNY(e, 'record'), 0);
  $('#ledger-total').textContent = money(total);
  $('#ledger-count').textContent = expenses.length + ' 笔';

  const list = $('#ledger-list');
  if (!expenses.length) {
    list.innerHTML = '<p class="muted">还没有记录。添加第一笔后会自动折算，并计算三人的结算。</p>';
  } else {
    list.innerHTML = expenses.slice()
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
      .map((e) => {
        const people = (e.shares ? Object.keys(e.shares) : e.split).join(' / ');
        return '<div class="expense">' +
          '<div class="expense-main">' +
            '<b>' + (e.note || '未填写说明') + '</b>' +
            '<span>' + e.date + ' · ' + e.payer + ' 支付 · ' + people + ' 分摊</span>' +
          '</div>' +
          '<div class="expense-side">' +
            '<b>' + e.amount + ' ' + e.currency + '</b>' +
            '<span class="muted tnum">≈ ' + money(toCNY(e, 'record')) + '</span>' +
            '<div class="expense-actions">' +
              '<button class="icon-btn" type="button" data-edit="' + e.id + '" aria-label="编辑这一笔">改</button>' +
              '<button class="icon-btn" type="button" data-del="' + e.id + '" aria-label="删除这一笔">×</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
  }

  const box = $('#settlement');
  if (!expenses.length) {
    box.innerHTML = '<p class="muted">还没有记录，先添加一笔支出。</p>';
    return;
  }

  const s = settle(settleRateMode);
  box.innerHTML =
    '<table class="balance-table">' +
      '<thead><tr><th>成员</th><th>已付</th><th>应摊</th><th>净额</th></tr></thead>' +
      '<tbody>' +
        MEMBERS.map((m) => {
          const net = s.paid[m] - s.owed[m];
          return '<tr><td>' + m + '</td>' +
            '<td>' + money(s.paid[m]) + '</td>' +
            '<td>' + money(s.owed[m]) + '</td>' +
            '<td>' + (net >= 0 ? '+' : '−') + money(Math.abs(net)) + '</td></tr>';
        }).join('') +
      '</tbody>' +
    '</table>' +
    '<div class="transfer-list">' +
      (s.transfers.length
        ? s.transfers.map((t) => '<div class="transfer"><span>' + t.from + ' → ' + t.to + '</span><b>' + money(t.amount) + '</b></div>').join('')
        : '<p class="muted">目前不需要转账。</p>') +
    '</div>' +
    '<p class="hint">' + (settleRateMode === 'record'
      ? '按每笔记录时的参考汇率折算。'
      : '按当前汇率重新折算，汇率变化会让金额有少量浮动。') + '</p>';
}

function resetForm() {
  editingId = null;
  const form = $('#expense-form');
  form.reset();
  $('#exp-date').value = '2026-09-25';
  splitState.BOFAN = true;
  splitState.NIKKI = true;
  splitState.PEIZHEN = true;
  document.querySelector('input[name="splitMode"][value="even"]').checked = true;
  renderMemberInputs();
  renderRateHint();
  $('#expense-reset').hidden = true;
  form.querySelector('.btn-primary').textContent = '保存支出';
}

$('#expense-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const mode = data.get('splitMode');
  const selected = MEMBERS.filter((m) => splitState[m]);
  if (!selected.length) {
    alert('至少要选择一位分摊人');
    return;
  }

  const amount = Number(data.get('amount'));
  if (!(amount > 0)) return;

  const record = {
    id: editingId || 'e' + Date.now() + Math.random().toString(36).slice(2, 6),
    date: data.get('date'),
    payer: data.get('payer'),
    amount: amount,
    currency: data.get('currency'),
    rate: rateOf(data.get('currency')),
    note: String(data.get('note') || '').trim(),
    split: selected,
    updatedAt: Date.now()
  };

  if (mode === 'custom') {
    const shares = {};
    let sum = 0;
    selected.forEach((m) => {
      const input = form.querySelector('[data-share="' + m + '"]');
      const value = Number(input ? input.value : 0);
      shares[m] = value;
      sum += value;
    });
    if (Math.abs(sum - amount) > 0.01) {
      alert('手动金额合计 ' + sum + '，与总额 ' + amount + ' 不一致');
      return;
    }
    record.shares = shares;
  }

  if (editingId) {
    const index = expenses.findIndex((e) => e.id === editingId);
    if (index >= 0) expenses[index] = record;
  } else {
    expenses.push(record);
  }

  resetForm();
  renderLedger();
  sync.push();
  selectTab('flow');
});

$('#expense-reset').addEventListener('click', resetForm);
$('#exp-amount').addEventListener('input', renderRateHint);
$('#exp-currency').addEventListener('change', renderRateHint);
$$('input[name="splitMode"]').forEach((radio) => radio.addEventListener('change', renderMemberInputs));

$('#ledger-list').addEventListener('click', (event) => {
  const del = event.target.closest('[data-del]');
  if (del) {
    if (!confirm('删除这一笔记录？')) return;
    expenses = expenses.filter((e) => e.id !== del.dataset.del);
    renderLedger();
    sync.push();
    return;
  }

  const edit = event.target.closest('[data-edit]');
  if (!edit) return;
  const item = expenses.find((x) => x.id === edit.dataset.edit);
  if (!item) return;

  editingId = item.id;
  selectTab('entry');
  $('#exp-date').value = item.date;
  $('#exp-payer').value = item.payer;
  $('#exp-amount').value = item.amount;
  $('#exp-currency').value = item.currency;
  $('#exp-note').value = item.note || '';
  const mode = item.shares ? 'custom' : 'even';
  document.querySelector('input[name="splitMode"][value="' + mode + '"]').checked = true;
  MEMBERS.forEach((m) => {
    splitState[m] = item.shares ? (m in item.shares) : item.split.indexOf(m) >= 0;
  });
  renderMemberInputs();
  if (item.shares) {
    MEMBERS.forEach((m) => {
      const input = document.querySelector('[data-share="' + m + '"]');
      if (input) input.value = item.shares[m] || 0;
    });
  }
  $('#expense-reset').hidden = false;
  $('#expense-form').querySelector('.btn-primary').textContent = '保存修改';
  renderRateHint();
  $('#expense-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$$('[data-settle-rate]').forEach((btn) => btn.addEventListener('click', () => {
  settleRateMode = btn.dataset.settleRate;
  $$('[data-settle-rate]').forEach((b) => {
    const active = b === btn;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  renderLedger();
}));

/* 页签切换 */
function selectTab(name) {
  const ids = { entry: 'tab-entry', flow: 'tab-flow', settle: 'tab-settle', rates: 'tab-rates' };
  Object.keys(ids).forEach((key) => {
    const btn = $('#' + ids[key]);
    const panel = $('#panel-' + key);
    const active = key === name;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
    panel.hidden = !active;
  });
}

$$('.tab').forEach((tab) => tab.addEventListener('click', () => selectTab(tab.id.replace('tab-', ''))));

/* 汇率：手动修改 + 联网更新 */
$('#rate-fetch').addEventListener('click', async () => {
  const status = $('#rate-status');
  status.textContent = '正在获取…';
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/CNY');
    const data = await res.json();
    if (!data || !data.rates) throw new Error('bad response');
    Object.keys(rates).forEach((code) => {
      if (code === 'CNY') return;
      const perCny = data.rates[code];
      if (perCny) rates[code] = Number((1 / perCny).toFixed(6));
    });
    saveRates();
    renderRateGrid();
    renderLedger();
    renderRateHint();
    status.textContent = '已更新 · ' + new Date().toLocaleString('zh-CN');
  } catch (err) {
    status.textContent = '联网更新失败，可以手动填写。';
  }
});

$('#rate-reset').addEventListener('click', () => {
  rates = Object.assign({}, DEFAULT_RATES);
  saveRates();
  renderRateGrid();
  renderLedger();
  renderRateHint();
  $('#rate-status').textContent = '已恢复默认值。';
});

/* ============================================================
   8. 三人同步（可选，需自备一个共享数据库地址）
   ============================================================ */

const sync = {
  settings: STORE.read(KEY.sync, { url: '', code: '' }),
  timer: null,

  active() {
    return Boolean(sync.settings.code && sync.base());
  },

  /** 后端地址：自己填的优先；页面本身就是从网上打开的，就用同一个域名 */
  base() {
    if (sync.settings.url) return sync.settings.url.replace(/\/+$/, '');
    if (/^https?:$/.test(location.protocol)) return location.origin;
    return '';
  },

  endpoint() {
    const base = sync.base();
    return base ? base + '/trips/' + encodeURIComponent(sync.settings.code) + '.json' : '';
  },

  restore() {
    $('#sync-url').value = sync.settings.url || '';
    $('#sync-code').value = sync.settings.code || '';
    $('#ledger-sync').textContent = sync.active() ? '已连接' : '本机';
    if (sync.active()) sync.start();
  },

  start() {
    clearInterval(sync.timer);
    sync.timer = setInterval(() => { if (navigator.onLine) sync.pull(); }, 15000);
    sync.pull();
  },

  save() {
    const url = $('#sync-url').value.trim();
    const code = $('#sync-code').value.trim();
    if (!code) {
      $('#sync-status').textContent = '至少要填一个行程码，三个人用同一个。';
      return;
    }
    if (!url && !/^https?:$/.test(location.protocol)) {
      $('#sync-status').textContent = '现在是从本机文件打开的，需要额外填写后端地址。';
      return;
    }
    sync.settings = { url: url, code: code };
    STORE.write(KEY.sync, sync.settings);
    $('#ledger-sync').textContent = '已连接';
    $('#sync-status').textContent = '正在连接 ' + sync.endpoint() + ' …';
    sync.start();
  },

  off() {
    sync.settings = { url: '', code: '' };
    STORE.write(KEY.sync, sync.settings);
    clearInterval(sync.timer);
    $('#ledger-sync').textContent = '本机';
    $('#sync-status').textContent = '已断开，数据仍然保存在本机。';
  },

  merge(incoming) {
    const map = new Map();
    (incoming || []).concat(expenses).forEach((e) => {
      if (!e || !e.id) return;
      const prev = map.get(e.id);
      if (!prev || (e.updatedAt || 0) > (prev.updatedAt || 0)) map.set(e.id, e);
    });
    expenses = Array.from(map.values());
    renderLedger();
  },

  /** 一次上传的内容：记账、每人的清单、汇率 */
  payload() {
    return {
      version: 2,
      expenses: expenses,
      checks: checkData,
      rates: rates,
      ratesUpdatedAt: ratesUpdatedAt,
      savedAt: Date.now()
    };
  },

  /** 合并远端内容：记账按条、清单按人、汇率按更新时间 */
  mergeAll(remote) {
    if (Array.isArray(remote.expenses)) sync.merge(remote.expenses);

    if (remote.checks) {
      let changed = false;
      Object.keys(remote.checks).forEach((name) => {
        const incoming = remote.checks[name];
        if (!incoming || !incoming.items) return;
        const local = checkData[name];
        if (!local || (incoming.updatedAt || 0) > (local.updatedAt || 0)) {
          checkData[name] = { items: incoming.items, updatedAt: incoming.updatedAt || 0 };
          changed = true;
        }
      });
      if (changed) {
        STORE.write(KEY.checks, checkData);
        renderChecklist();
      }
    }

    if (remote.rates && (remote.ratesUpdatedAt || 0) > ratesUpdatedAt) {
      rates = Object.assign({}, DEFAULT_RATES, remote.rates);
      ratesUpdatedAt = remote.ratesUpdatedAt || 0;
      STORE.write(KEY.rates, rates);
      STORE.write(KEY.ratesAt, ratesUpdatedAt);
      renderRateGrid();
      renderLedger();
      renderRateHint();
    }
  },

  async push() {
    if (!sync.active() || !navigator.onLine) return;
    try {
      /* 先取回远端并入本机，再整体写回：避免两个人同时记账时互相覆盖 */
      await sync.pull(true);
      await fetch(sync.endpoint(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sync.payload())
      });
      $('#sync-status').textContent = '已同步 · ' + new Date().toLocaleTimeString('zh-CN');
    } catch (err) {
      $('#sync-status').textContent = '同步失败，稍后会自动重试。';
    }
  },

  async pull(quiet) {
    if (!sync.active()) return;
    try {
      const res = await fetch(sync.endpoint());
      const data = await res.json();
      if (Array.isArray(data)) {
        sync.merge(data);                 /* 兼容旧版：只有一个记账数组 */
        $('#sync-status').textContent = '已同步 · ' + new Date().toLocaleTimeString('zh-CN');
      } else if (data && typeof data === 'object') {
        sync.mergeAll(data);
        $('#sync-status').textContent = '已同步 · ' + new Date().toLocaleTimeString('zh-CN');
      } else if (!quiet) {
        sync.push();
      }
    } catch (err) {
      $('#sync-status').textContent = '暂时连不上数据库，先用本机数据。';
    }
  }
};

/* 勾选、改汇率之后延迟合并上传，避免频繁请求 */
let syncDebounce = null;
function scheduleSync() {
  clearTimeout(syncDebounce);
  syncDebounce = setTimeout(() => sync.push(), 900);
}

$('#sync-save').addEventListener('click', sync.save);
$('#sync-off').addEventListener('click', sync.off);

$('#data-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ expenses: expenses, rates: rates }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'caucasus-2026-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  $('#data-status').textContent = '已导出 JSON 文件。';
});

$('#data-import').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const incoming = Array.isArray(data) ? data : data.expenses;
        if (!Array.isArray(incoming)) throw new Error('bad file');
        sync.merge(incoming);
        if (data.rates) {
          rates = Object.assign({}, DEFAULT_RATES, data.rates);
          saveRates();
          renderRateGrid();
          renderRateHint();
        }
        $('#data-status').textContent = '已导入 ' + incoming.length + ' 笔记录。';
      } catch (err) {
        $('#data-status').textContent = '文件格式无法识别。';
      }
    };
    reader.readAsText(file);
  };
  input.click();
});

/* ============================================================
   9. Check List
   ============================================================ */

/* 清单按人分开：{ 人名: { items: { "类别::序号": true }, updatedAt } } */
let checkData = STORE.read(KEY.checks, {});
let openGroups = STORE.read(KEY.openGroups, {});
let currentPerson = STORE.read(KEY.person, MEMBERS[0]);
if (MEMBERS.indexOf(currentPerson) < 0) currentPerson = MEMBERS[0];

/* 旧版本把勾选存在一张扁平表里，迁移到当前成员名下 */
(function migrateOldChecks() {
  const keys = Object.keys(checkData);
  if (!keys.length || !keys.every((k) => k.indexOf('::') > 0)) return;
  const legacy = checkData;
  checkData = {};
  checkData[currentPerson] = { items: legacy, updatedAt: Date.now() };
  STORE.write(KEY.checks, checkData);
})();

const checkId = (group, index) => group + '::' + index;

function personBox(name) {
  if (!checkData[name]) checkData[name] = { items: {}, updatedAt: 0 };
  if (!checkData[name].items) checkData[name].items = {};
  return checkData[name];
}

function personItems(name) {
  return personBox(name).items;
}

function renderPersonSwitch() {
  const wrap = $('#person-switch');
  if (!wrap) return;
  wrap.innerHTML = MEMBERS.map((m) =>
    '<button type="button" class="seg' + (m === currentPerson ? ' is-active' : '') + '"' +
    ' data-person="' + m + '" aria-pressed="' + (m === currentPerson) + '">' + m + '</button>').join('');

  const note = $('#check-note');
  if (note) {
    const done = CHECKLIST.reduce((sum, g) =>
      sum + g.items.filter((_, i) => personItems(currentPerson)[checkId(g.name, i)]).length, 0);
    note.textContent = '当前显示 ' + currentPerson + ' 的清单（已勾 ' + done + ' 项）。' +
      '切换成员只影响显示，不会改动别人的勾选。';
  }
}

function progressText() {
  const total = CHECKLIST.reduce((sum, g) => sum + g.items.length, 0);
  const done = CHECKLIST.reduce((sum, g) =>
    sum + g.items.filter((_, i) => personItems(currentPerson)[checkId(g.name, i)]).length, 0);
  $('#check-progress').textContent = currentPerson + ' 已备 ' + done + ' / ' + total + ' 项';
  $('#check-bar').style.width = (total ? (done / total) * 100 : 0) + '%';
}

function groupDone(group) {
  return group.items.filter((_, i) => personItems(currentPerson)[checkId(group.name, i)]).length;
}

function renderChecklist() {
  const list = $('#check-list');
  list.innerHTML = '';

  CHECKLIST.forEach((group) => {
    const card = el('section', 'check-group');
    const open = Boolean(openGroups[group.name]);
    const panelId = 'group-' + group.name;

    const toggle = el('button', 'group-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-controls', panelId);
    toggle.innerHTML =
      '<span class="group-chev" aria-hidden="true">' + (open ? '▾' : '▸') + '</span>' +
      '<b>' + group.name + '</b>' +
      '<span class="group-count">' + groupDone(group) + '/' + group.items.length + '</span>';

    const panel = el('div', 'group-panel');
    panel.id = panelId;
    panel.hidden = !open;
    panel.innerHTML = group.items.map((item, index) =>
      '<label class="check-item">' +
        '<input type="checkbox" data-group="' + group.name + '" data-index="' + index + '"' +
        (personItems(currentPerson)[checkId(group.name, index)] ? ' checked' : '') + '>' +
        '<span class="check-text">' + item.t + (item.n ? '<em>' + item.n + '</em>' : '') + '</span>' +
      '</label>').join('');

    toggle.addEventListener('click', () => {
      openGroups[group.name] = !openGroups[group.name];
      STORE.write(KEY.openGroups, openGroups);
      renderChecklist();
    });

    card.append(toggle, panel);
    list.appendChild(card);
  });

  progressText();
  renderPersonSwitch();
}

$('#check-list').addEventListener('change', (event) => {
  const input = event.target.closest('input[type="checkbox"]');
  if (!input) return;
  const box = personBox(currentPerson);
  box.items[checkId(input.dataset.group, input.dataset.index)] = input.checked;
  box.updatedAt = Date.now();
  STORE.write(KEY.checks, checkData);
  const group = CHECKLIST.find((g) => g.name === input.dataset.group);
  input.closest('.check-group').querySelector('.group-count').textContent =
    groupDone(group) + '/' + group.items.length;
  progressText();
  renderPersonSwitch();
  scheduleSync();
});

$('#person-switch').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-person]');
  if (!btn) return;
  currentPerson = btn.dataset.person;
  STORE.write(KEY.person, currentPerson);
  renderChecklist();
});

$('#expand-all').addEventListener('click', () => {
  CHECKLIST.forEach((g) => { openGroups[g.name] = true; });
  STORE.write(KEY.openGroups, openGroups);
  renderChecklist();
});

$('#collapse-all').addEventListener('click', () => {
  CHECKLIST.forEach((g) => { openGroups[g.name] = false; });
  STORE.write(KEY.openGroups, openGroups);
  renderChecklist();
});

$('#check-reset').addEventListener('click', () => {
  if (!confirm('清空 ' + currentPerson + ' 的所有勾选？')) return;
  personBox(currentPerson).items = {};
  personBox(currentPerson).updatedAt = Date.now();
  STORE.write(KEY.checks, checkData);
  renderChecklist();
  scheduleSync();
});

/* ============================================================
   10. App 清单 / 保险与紧急 / 页脚
   ============================================================ */

$('#app-list').innerHTML = APPS.map((group) =>
  '<section class="app-card">' +
    '<h3>' + group.name + '</h3>' +
    '<ul>' + group.items.map((item) =>
      '<li>' +
        '<span class="app-name">' + item.t + '</span>' +
        (item.n ? '<span>' + item.n + '</span>' : '') +
        (item.url ? '<a href="' + item.url + '" target="_blank" rel="noopener">' + item.url.replace(/^https?:\/\//, '') + '</a>' : '') +
      '</li>').join('') + '</ul>' +
  '</section>').join('');

$('#safety-grid').innerHTML = SAFETY.map((card) =>
  '<section class="safety-card">' +
    '<h3>' + card.h + '</h3>' +
    '<b>' + card.b + '</b>' +
    '<ul>' + card.li.map((item) => Array.isArray(item)
      ? '<li>' + item[0] + '<span>' + item[1] + '</span></li>'
      : '<li>' + item + '</li>').join('') + '</ul>' +
    (card.n ? '<p class="hint">' + card.n + '</p>' : '') +
  '</section>').join('');

$('#credits').innerHTML = CREDITS.map((row) =>
  '<li>' + row[0] + ' — Wikimedia Commons · ' + row[1] + ' · ' + row[2] + '</li>').join('');

/* ============================================================
   11. 回到顶部
   ============================================================ */

const toTop = $('#to-top');
window.addEventListener('scroll', () => { toTop.hidden = window.scrollY < 600; }, { passive: true });
toTop.hidden = window.scrollY < 600;
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ============================================================
   12. 启动
   ============================================================ */

renderPayerOptions();
renderCurrencyOptions();
renderMemberInputs();
renderRateHint();
renderRateGrid();
renderLedger();
renderChecklist();
sync.restore();

window.addEventListener('online', () => sync.push());
window.addEventListener('beforeunload', () => sync.push());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && navigator.onLine) sync.pull();
});
