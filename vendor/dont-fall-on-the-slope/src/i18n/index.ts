// Every player-facing string, per language. The game picks a table with the
// `lang` prop (default English); nothing else in the game hard-codes text.
//
// English comes from the existing modules (core/lines.ts, core/captions.ts,
// core/score.ts). Japanese is a draft by Claude and needs a native
// speaker's review (Chika) before it is shown to visitors; history facts in
// the gallery shorts follow content/otaru-slope.md. Game lines (crash,
// close-call, finish) are jokes and must never state history.
import { GALLERY, SHORTS } from "../core/captions";
import {
  CLOSE_CALL_LINES,
  crashLine,
  FINISH_LINE,
  GLASS_LINE,
  GLASS_TITLE,
  READY_LINE,
  TITLE,
} from "../core/lines";
import { EN_TITLES, type RunTitles } from "../core/score";

export type Lang = "en" | "ja";
export const LANGS: readonly Lang[] = ["en", "ja"];

export type Strings = {
  lang: Lang;
  title: string;
  /** The language button: names the *other* language. */
  switchLang: string;
  switchLangAria: string;
  /** aria-label of the game's host element. */
  hostLabel: string;
  noWebgl: string;
  // Start
  readyKind: string;
  readyLine: string;
  readyAnnounce: string;
  begin: string;
  slideAgain: string;
  slipAnnounce: string;
  hintTouch: string;
  hintKeys: string;
  /** Key diagram on the cards (keyboard devices). */
  keysLeft: string;
  keysRight: string;
  keysBrace: string;
  keysOr: string;
  keysNoW: string;
  keysTrackpad: string;
  /** Shown as the slide starts, after the card is gone. */
  controlsToast: string;
  // Touch pad and sound
  padLeft: string;
  padBrace: string;
  padRight: string;
  soundOn: string;
  soundOff: string;
  soundOnAria: string;
  soundOffAria: string;
  soundOnAnnounce: string;
  soundOffAnnounce: string;
  // Meter
  metres: (n: number) => string;
  best: (n: number) => string;
  meterCaptions: (a: number, b: number) => string;
  meterNoticed: (a: number, b: number) => string;
  // Gallery captions (same order as GALLERY in core/captions.ts)
  gallery: { title: string; short: string }[];
  captionCount: (n: number, total: number) => string;
  captionAnnounce: (
    n: number,
    total: number,
    title: string,
    short: string,
  ) => string;
  // Exhibits
  noticedToast: (label: string, fresh: boolean) => string;
  noticedAnnounce: (label: string) => string;
  whatYouNoticed: string;
  youSlidPast: string;
  newTag: string;
  notebook: (n: number, total: number) => string;
  notebookDone: (total: number) => string;
  // Crash and finish
  exhibitTouched: string;
  hit: Record<string, string>;
  crash: (what: string | null) => string;
  glassName: string;
  glassTitle: string;
  glassLabel: string;
  glassLine: string;
  canalKind: string;
  madeIt: string;
  finishLine: string;
  crashedAnnounce: (
    m: number,
    line: string,
    title: string,
    a: number,
    b: number,
    style: number,
  ) => string;
  finishedAnnounce: (
    m: number,
    line: string,
    title: string,
    a: number,
    b: number,
    style: number,
  ) => string;
  // Close calls and snow
  closeCalls: string[];
  closePassed: (name: string, kmh: number) => string;
  closeCount: (n: number) => string;
  stylePoints: string;
  closeAnnounce: (line: string) => string;
  snowToast: string;
  snowAnnounce: string;
  // Score card and sharing
  share: string;
  download: string;
  shared: string;
  downloaded: string;
  shareText: (
    title: string,
    m: number,
    a: number,
    b: number,
    link?: string,
  ) => string;
  outcomeFinished: string;
  outcomeContact: string;
  card: {
    medium: (outcome: string) => string;
    distance: string;
    captions: string;
    style: string;
    distanceValue: (d: number, best: number) => string;
    captionsValue: (a: number, b: number) => string;
    styleValue: (s: number, closeCalls: number, streak: number) => string;
    honesty: string;
    link: (url: string) => string;
    slope: (seed: number) => string;
  };
  runTitles: RunTitles;
};

const en: Strings = {
  lang: "en",
  title: TITLE,
  switchLang: "日本語",
  switchLangAria: "日本語に切り替える (Switch to Japanese)",
  hostLabel: `${TITLE}. Slide down an icy street without touching anything.`,
  noWebgl: `${TITLE} needs 3D graphics (WebGL), which aren't available here.`,
  readyKind: "Gallery of the slope",
  readyLine: READY_LINE,
  readyAnnounce: `${TITLE}. ${READY_LINE} Press Enter to start.`,
  begin: "Start to slide",
  slideAgain: "Slide again",
  slipAnnounce: "You slip. Lean with the arrow keys, brace with Space.",
  hintTouch: "Tap ◀ ▶ to lean · hold Brace to slow down · or drag sideways",
  hintKeys: "← → or A D to lean · ↓ or Space to brace · Enter to start",
  keysLeft: "Left",
  keysRight: "Right",
  keysBrace: "Brace",
  keysOr: "or",
  keysNoW: "No W or ↑: gravity does the rest.",
  keysTrackpad: "Trackpad or mouse: swipe or drag sideways to steer.",
  controlsToast: "Steer: A D or ← →   ·   Brace: S, ↓ or Space",
  padLeft: "Lean left",
  padBrace: "Brace",
  padRight: "Lean right",
  soundOn: "Sound on",
  soundOff: "Sound off",
  soundOnAria: "Sound on (M)",
  soundOffAria: "Sound off (M)",
  soundOnAnnounce: "Sound on.",
  soundOffAnnounce: "Sound off.",
  metres: (n) => `${n} m`,
  best: (n) => `best ${n} m`,
  meterCaptions: (a, b) => `captions ${a}/${b}`,
  meterNoticed: (a, b) => `noticed ${a}/${b}`,
  gallery: GALLERY.map((g, i) => ({
    title: g.title,
    short: SHORTS[i] ?? g.label,
  })),
  captionCount: (n, total) => `${n} of ${total}`,
  captionAnnounce: (n, total, title, short) =>
    `Caption ${n} of ${total}: ${title}. ${short}.`,
  noticedToast: (label, fresh) => `Noticed: ${label}${fresh ? " · new" : ""}`,
  noticedAnnounce: (label) => `You noticed ${label}. The end card explains it.`,
  whatYouNoticed: "What you noticed",
  youSlidPast: "You slid past",
  newTag: "New",
  notebook: (n, total) => `Street notebook: ${n} of ${total} seen.`,
  notebookDone: (total) => `Street notebook complete: all ${total} seen.`,
  exhibitTouched: "Exhibit touched",
  hit: {
    shopfront: "Shopfront",
    "snow-pile": "Snow pile",
    "lamp-post": "Lamp post",
    crate: "Crate",
    bicycle: "Bicycle",
    tourist: "Fellow visitor",
    rickshaw: "Rickshaw",
    "herring-crates": "Herring crates",
    sled: "Sled",
    snowman: "Snowman",
    exhibit: "Exhibit",
  },
  crash: (what) => crashLine(what),
  glassName: "Glass workshop",
  glassTitle: GLASS_TITLE,
  glassLabel: "Glass workshop. Fragile, as labelled.",
  glassLine: GLASS_LINE,
  canalKind: "The canal",
  madeIt: "You made it.",
  finishLine: FINISH_LINE,
  crashedAnnounce: (m, line, title, a, b, style) =>
    `Crashed after ${m} metres. ${line} ${title}. ${a} of ${b} captions, ${style} style points.`,
  finishedAnnounce: (m, line, title, a, b, style) =>
    `Reached the canal: ${m} metres. ${line} ${title}. ${a} of ${b} captions, ${style} style points.`,
  closeCalls: CLOSE_CALL_LINES,
  closePassed: (name, kmh) => `${name}, passed at ${kmh} km/h.`,
  closeCount: (n) => `${n} close ${n === 1 ? "call" : "calls"}`,
  stylePoints: "Style points",
  closeAnnounce: (line) => `Close call. ${line}`,
  snowToast: "Through the snow pile. Slower now.",
  snowAnnounce: "You plough through a snow pile and slow down.",
  share: "Share",
  download: "Download image",
  shared: "Score card shared.",
  downloaded: "Score card image downloaded.",
  shareText: (title, m, a, b, link) =>
    `${title}: ${m} m, ${a} of ${b} captions.${link ? ` Same slope: ${link}` : ""}`,
  outcomeFinished: "Reached the canal.",
  outcomeContact: "Contact was made.",
  card: {
    medium: (outcome) => `Ice, gravity and a visitor. ${outcome}`,
    distance: "Distance",
    captions: "Captions",
    style: "Style points",
    distanceValue: (d, best) => `${d} m${best > d ? `  (best ${best} m)` : ""}`,
    captionsValue: (a, b) => `${a} of ${b}`,
    styleValue: (s, cc, streak) =>
      `${s}  (${cc} close calls, streak ${streak})`,
    honesty: "ILLUSTRATIVE · RESEARCH PREVIEW",
    link: (url) => `Same slope: ${url}`,
    slope: (seed) => `Slope ${seed}`,
  },
  runTitles: EN_TITLES,
};

const JA_TITLE = "坂道で転ばないでください";

const ja: Strings = {
  lang: "ja",
  title: JA_TITLE,
  switchLang: "English",
  switchLangAria: "Switch to English（英語に切り替える）",
  hostLabel: `${JA_TITLE}。何にも触れずに、凍った坂道をすべり降りるゲーム。`,
  noWebgl: `${JA_TITLE}には3Dグラフィックス（WebGL）が必要ですが、この環境では使えません。`,
  readyKind: "坂のギャラリー",
  readyLine: "展示物や人には手を触れないでください。",
  readyAnnounce: `${JA_TITLE}。展示物や人には手を触れないでください。Enterでスタートします。`,
  begin: "すべり始める",
  slideAgain: "もう一度すべる",
  slipAnnounce:
    "足がすべりました。矢印キーで体を傾け、Spaceでブレーキをかけます。",
  hintTouch: "◀ ▶ で傾く・「ブレーキ」長押しで減速・左右ドラッグでも操作",
  hintKeys:
    "← → または A D で傾く・↓ または Space でブレーキ・Enter でスタート",
  keysLeft: "左",
  keysRight: "右",
  keysBrace: "ブレーキ",
  keysOr: "または",
  keysNoW: "W・↑ は不要：重力におまかせ。",
  keysTrackpad: "トラックパッド・マウス：左右にスワイプかドラッグでかたむく。",
  controlsToast: "かたむく：A D または ← →　・　ブレーキ：S、↓ または Space",
  padLeft: "左に傾く",
  padBrace: "ブレーキ",
  padRight: "右に傾く",
  soundOn: "サウンド オン",
  soundOff: "サウンド オフ",
  soundOnAria: "サウンド オン（M）",
  soundOffAria: "サウンド オフ（M）",
  soundOnAnnounce: "サウンドをオンにしました。",
  soundOffAnnounce: "サウンドをオフにしました。",
  metres: (n) => `${n} m`,
  best: (n) => `ベスト ${n} m`,
  meterCaptions: (a, b) => `キャプション ${a}/${b}`,
  meterNoticed: (a, b) => `発見 ${a}/${b}`,
  gallery: [
    { title: "卯建のある商家", short: "1895年頃・石、瓦、卯建" },
    {
      title: "楽隊バルコニーのある時計店",
      short: "20世紀初め・楽隊のバルコニー",
    },
    { title: "米穀商", short: "1912年・れんが造2階建て" },
    { title: "問屋", short: "砂糖、綿、米" },
    { title: "ガラス工房", short: "1901年から・石油ランプ、浮き玉" },
    { title: "鰊肥料の倉庫", short: "1890年代・火山石の壁、台車のレール" },
    { title: "ランプの灯る館", short: "現在・167個の石油ランプを手で点灯" },
    { title: "銀行", short: "1910年代・石の柱" },
    { title: "鯱のある船主の倉庫", short: "1890年・鯱が8体" },
    { title: "家印のある海運商家", short: "1890年代・描かれた家印" },
    { title: "ホテル", short: "1931年・空室あり" },
    { title: "運河の倉庫", short: "1925年・石と木" },
  ],
  captionCount: (n, total) => `${n} / ${total}`,
  captionAnnounce: (n, total, title, short) =>
    `キャプション ${n}／${total}：${title}。${short}。`,
  noticedToast: (label, fresh) => `発見：${label}${fresh ? "・初" : ""}`,
  noticedAnnounce: (label) =>
    `${label}を見つけました。終了カードで説明します。`,
  whatYouNoticed: "見つけたもの",
  youSlidPast: "見逃したもの",
  newTag: "初",
  notebook: (n, total) => `通りのノート：${total}件中${n}件を発見。`,
  notebookDone: (total) => `通りのノート完成：${total}件すべて発見。`,
  exhibitTouched: "展示物に接触",
  hit: {
    shopfront: "店先",
    "snow-pile": "雪の山",
    "lamp-post": "街灯",
    crate: "木箱",
    bicycle: "自転車",
    tourist: "ほかの来館者",
    rickshaw: "人力車",
    "herring-crates": "鰊箱",
    sled: "ソリ",
    snowman: "雪だるま",
    exhibit: "展示物",
  },
  crash: (what) =>
    ({
      shopfront: "店先に触れました。建築は適切な距離からご鑑賞ください。",
      "snow-pile": "雪の山に入りました。入口ではありません。",
      "lamp-post": "街灯を抱きしめました。",
      crate: "木箱を高速で検分しました。",
      bicycle:
        "駐輪中の自転車に触れました。自転車はきちんと止まっていました。あなたと違って。",
      tourist: "ほかの来館者にぶつかりました。ひと言、謝りましょう。",
      rickshaw: "料金を払わずに人力車に乗り込みました。",
      "herring-crates": "鰊箱を並べ替えました。",
      sled: "子どものソリにつまずきました。",
      snowman: "雪だるまの帽子を落としました。",
    })[what ?? ""] ?? "展示物に触れました。",
  glassName: "ガラス工房",
  glassTitle: "作品に手を触れないでください。",
  glassLabel: "ガラス工房。表示のとおり、割れ物です。",
  glassLine: "ガラス工房に触れました。",
  canalKind: "運河",
  madeIt: "到着しました。",
  // Reviewed with Chika: the literal "staff were told to stay calm" did not
  // read in Japanese; "the staff cannot hide their surprise" does.
  finishLine: "何にも触れずに運河に到着しました。係員一同、驚きを隠せません。",
  crashedAnnounce: (m, line, title, a, b, style) =>
    `${m}メートルで接触。${line} ${title}。キャプション${b}件中${a}件、スタイルポイント${style}。`,
  finishedAnnounce: (m, line, title, a, b, style) =>
    `運河に到着：${m}メートル。${line} ${title}。キャプション${b}件中${a}件、スタイルポイント${style}。`,
  closeCalls: [
    "大胆な解釈です。",
    "攻めていますね。学芸員がメモを取っています。",
    "推奨距離より近すぎます。",
    "間近でのご鑑賞です。",
    "展示物に風が当たりました。",
    "厳密には、接触はありませんでした。",
  ],
  closePassed: (name, kmh) => `${name}、時速${kmh}kmで通過。`,
  closeCount: (n) => `ニアミス${n}回`,
  stylePoints: "スタイルポイント",
  closeAnnounce: (line) => `ニアミス。${line}`,
  snowToast: "雪の山を突き抜けました。少し減速。",
  snowAnnounce: "雪の山を突き抜けて、減速しました。",
  share: "シェア",
  download: "画像を保存",
  shared: "スコアカードをシェアしました。",
  downloaded: "スコアカードの画像を保存しました。",
  shareText: (title, m, a, b, link) =>
    `${title}：${m} m、キャプション${b}件中${a}件。${link ? ` 同じ坂：${link}` : ""}`,
  outcomeFinished: "運河に到着。",
  outcomeContact: "接触あり。",
  card: {
    medium: (outcome) => `氷、重力、来館者一名。${outcome}`,
    distance: "距離",
    captions: "キャプション",
    style: "スタイル",
    distanceValue: (d, best) =>
      `${d} m${best > d ? `（ベスト ${best} m）` : ""}`,
    captionsValue: (a, b) => `${b}件中${a}件`,
    styleValue: (s, cc, streak) => `${s}（ニアミス${cc}回・連続${streak}）`,
    honesty: "イラスト表現・調査段階（未レビュー）",
    link: (url) => `同じ坂：${url}`,
    slope: (seed) => `坂 ${seed}`,
  },
  runTitles: {
    crash: {
      shopfront: ["ファサードと出会う人物", "建築習作（唐突）"],
      "lamp-post": ["街灯のある人物", "抱擁（鉄）"],
      crate: ["木箱のある静物", "木の構成"],
      bicycle: ["自転車のあるコンポジション", "駐輪、乱される"],
      tourist: ["二人の来館者", "集合肖像（予定外）"],
      glass: ["お手を触れないでください", "ガラスの習作（依頼なし）"],
    },
    open: ["無題（下降）", "下降、中断", "氷の習作"],
    finish: ["運河への到着", "無題（完全な下降）"],
    format: (name, year) => `${name}、${year}年`,
  },
};

export const STRINGS: Record<Lang, Strings> = { en, ja };

/** The table for a language; anything unknown falls back to English. */
export function strings(lang?: string): Strings {
  return lang === "ja" ? ja : en;
}

/** Japanese for a browser language like "ja" or "ja-JP"; else English. */
export function langFrom(tag: string | undefined | null): Lang {
  return tag?.toLowerCase().startsWith("ja") ? "ja" : "en";
}
