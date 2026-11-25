// The Envelope, client side: load envelopes and observations, resolve supersession, render the
// record by time stratum with evidence, standing and absence kept separate, and add observations.
// Observations are never edited: a correction is a new observation with `supersedes`.
// English is the record as written; the Japanese view shows a machine translation, labelled as one.

const STRATA_KEYS = ['depicted-1808', 'made-1971', 'observed', 'present-2026'];
const L = {
  en: {
    strata: { 'depicted-1808': '1808 · what the diorama depicts', 'made-1971': '1971 · how the diorama was made', observed: 'Observed since', 'present-2026': '2026 · now' },
    stratumShort: { 'depicted-1808': '1808', 'made-1971': '1971', observed: 'observed', 'present-2026': '2026' },
    unknown: 'Unknown', why: 'Why', evidence: 'evidence', standing: 'standing', unverified: 'unverified', only: (a) => `${a} only`,
    howSupported: 'How well the claim is supported', grantedBy: (g) => `Granted by ${g}`, selfDeclared: 'Self-declared',
    addedBy: (a) => ` · added by ${a}`, earlier: (n) => `Earlier version${n > 1 ? `s (${n})` : ''}`, correct: 'Correct this',
    nothing: 'Nothing recorded yet.', machine: null, crumbDepicts: (d) => ` — depicts ${d}`,
    add: 'Add an observation', correctTitle: 'Correct an observation', claimPh: 'What you know, or what is unknown — in plain words',
    grantedPh: 'Recognised by (optional)', refPh: 'Citation, document, or who told you', causePh: 'Why it is unknown (optional detail)', namePh: 'Your name',
    fObservation: 'Observation', fKind: 'Kind', fTime: 'Time', fEvidence: 'Evidence', fStanding: 'Standing', fSourceType: 'Source type',
    fPerspective: 'Perspective', fUnknownBecause: 'Unknown because', fDetail: 'Detail', fSource: 'Source', fRecognised: 'Standing recognised by',
    fAudience: 'Who may see it', fName: 'Your name', save: 'Save observation', saving: 'Saving…',
    saved: 'Saved. Nothing was overwritten: the record keeps every version.', replaces: (c) => `Replaces: “${c}”. The original stays in the history.`,
    failed: (s) => `Failed (${s})`, formNote: '',
    v: {},
  },
  ja: {
    strata: { 'depicted-1808': '1808年 · ジオラマが描く場面', 'made-1971': '1971年 · ジオラマの制作', observed: 'その後の観察', 'present-2026': '2026年 · 現在' },
    stratumShort: { 'depicted-1808': '1808年', 'made-1971': '1971年', observed: '観察', 'present-2026': '2026年' },
    unknown: '不明', why: '理由', evidence: '根拠', standing: '立場', unverified: '未検証', only: (a) => `${a}のみ`,
    howSupported: '主張がどの程度裏付けられているか', grantedBy: (g) => `認定：${g}`, selfDeclared: '自己申告',
    addedBy: (a) => ` · 追加：${a}`, earlier: (n) => `以前の版${n > 1 ? `（${n}件）` : ''}`, correct: '訂正する',
    nothing: 'まだ記録はありません。', machine: '機械翻訳', crumbDepicts: (d) => ` — 描く場面：${d}`,
    add: '観察を追加', correctTitle: '観察を訂正', claimPh: '知っていること、または分からないことを平易な言葉で',
    grantedPh: '認めている人・団体（任意）', refPh: '出典・資料、または誰から聞いたか', causePh: '分からない理由（任意）', namePh: 'お名前',
    fObservation: '観察', fKind: '種類', fTime: '時代', fEvidence: '根拠', fStanding: '立場', fSourceType: '出典の種類',
    fPerspective: '視点', fUnknownBecause: '分からない理由', fDetail: '詳細', fSource: '出典', fRecognised: '立場を認めている人・団体',
    fAudience: '公開範囲', fName: 'お名前', save: '観察を保存', saving: '保存しています…',
    saved: '保存しました。上書きはされず、記録はすべての版を残します。', replaces: (c) => `置き換え対象：「${c}」。元の記録は履歴に残ります。`,
    failed: (s) => `失敗しました（${s}）`, formNote: '日本語でも英語でも入力できます。入力した言葉がそのまま記録の原文になります。',
    v: {
      event: '出来事', contact: '接触', meaning: '意味', making: '制作', use: '使用', appearance: '外見', provenance: '来歴', absence: '欠落',
      'contemporary-document': '同時代の文書', 'later-account': '後の記述', 'physical-trace': '物的痕跡', inference: '推定', none: 'なし',
      witness: '目撃者', maker: '制作者', descendant: '子孫', 'community-authority': '共同体の権威', scholar: '研究者', curator: '学芸員', contributor: '投稿者', passerby: '来訪者',
      document: '文書', label: '展示解説', testimony: '証言', photo: '写真', scan: 'スキャン', painting: '絵画', 'project-note': 'プロジェクトのメモ',
      'never-collected': '収集されなかった', destroyed: '破壊された', suppressed: '抑圧された', restricted: '制限されている', lost: '失われた',
      project: 'プロジェクト', 'aizu-record': '会津の記録', 'matsumae-account': '松前の記述', 'ainu-oral-tradition': 'アイヌの口承', 'modern-scholarship': '現代の研究', museum: '博物館',
      public: '一般', team: 'チーム', family: '家族', community: '共同体',
      'depicted-1808': '1808年 · 描かれた場面', 'made-1971': '1971年 · 制作', observed: '観察', 'present-2026': '2026年 · 現在',
    },
  },
};
let LANG = 'en';
const tr = () => L[LANG];
export function setLang(lang) { LANG = lang === 'ja' ? 'ja' : 'en'; }
export const label = (v) => (LANG === 'ja' && L.ja.v[v]) || String(v || '').replace(/-/g, ' ');
const human = label;
// Text of an observation in the current language (falls back to the English original).
const txt = (o, f) => (LANG === 'ja' && o.ja?.[f]) || ({ claim: o.claim, note: o.note, absenceNote: o.absence?.note, sourceRef: o.source?.ref })[f];

const SELECTS = {
  kind: ['event', 'contact', 'meaning', 'making', 'use', 'appearance', 'provenance', 'absence'],
  stratum: STRATA_KEYS,
  evidence: ['contemporary-document', 'later-account', 'physical-trace', 'inference', 'none'],
  role: ['witness', 'maker', 'descendant', 'community-authority', 'scholar', 'curator', 'contributor', 'passerby'],
  sourceType: ['document', 'label', 'testimony', 'photo', 'scan', 'painting', 'inference', 'project-note'],
  cause: ['never-collected', 'destroyed', 'suppressed', 'restricted', 'lost'],
  perspective: ['project', 'aizu-record', 'matsumae-account', 'ainu-oral-tradition', 'modern-scholarship', 'museum'],
  audience: ['public', 'team', 'family', 'community'],
};

export const state = { envelopes: [], forms: [], all: [], supersededBy: new Map(), canWrite: false };

// ---- Form layer: how a thing can be seen, and how directly it records it.
const BASIS = {
  recorded: { level: 3, en: ['Recorded', 'Captured from the object itself'], ja: ['実写', '対象そのものから撮影・計測したもの'] },
  interpreted: { level: 2, en: ['Interpreted', 'Made by a person from looking or from sources'], ja: ['解釈', '人が観察や資料をもとに制作したもの'] },
  symbolic: { level: 1, en: ['Symbolic', 'Generated: it stands for the figure, but is not a record of it'], ja: ['象徴', '生成物：人物を表すが、記録ではない'] },
};
const KIND = {
  splat: ['Gaussian splat', 'ガウシアンスプラット'], scan: ['3D scan', '3Dスキャン'], photo: ['Photograph', '写真'],
  'photo-series': ['Photographs', '連続写真'], video: ['Video', '動画'], painting: ['Painting', '絵画'], drawing: ['Drawing', '素描'],
  diorama: ['Diorama', 'ジオラマ'], reconstruction: ['AI reconstruction', 'AIによる再構成'],
};
const COVERAGE = { 'all-sides': ['all sides', '全方向'], partial: ['partly', '一部'], 'one-view': ['one side only', '一方向のみ'] };
const FORM_T = {
  en: { how: 'How this view was made', madeFrom: 'Made from', unseen: 'Never captured', held: 'Held as a source, not shown (rights not yet cleared)', notes: 'Notes on this reproduction', scale: 'Reality basis', by: 'by' },
  ja: { how: 'この表示のつくり', madeFrom: 'もとにした資料', unseen: '撮影されていない部分', held: '資料として保管・非公開（権利確認前）', notes: 'この複製についての記録', scale: '実在性の根拠', by: '撮影・制作：' },
};
const ICON = {
  splat: '<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/><circle cx="12" cy="12" r="1.6"/><circle cx="8.5" cy="10" r="1"/><circle cx="15.5" cy="10" r="1"/><circle cx="9.5" cy="15" r="1"/><circle cx="14.5" cy="15" r="1"/>',
  scan: '<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/><path d="M12 7l4.5 2.5v5L12 17l-4.5-2.5v-5z"/>',
  photo: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  'photo-series': '<rect x="7" y="8" width="13" height="11" rx="1.5"/><path d="M4 16V6a1 1 0 0 1 1-1h11"/><circle cx="13.5" cy="13.5" r="2.6"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  painting: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="8.5" r="1.5"/>',
  drawing: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',
  diorama: '<path d="M3 18h18M5 18v-6l7-5 7 5v6"/><path d="M10 18v-4h4v4"/>',
  reconstruction: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
};
const pick = (pair) => (Array.isArray(pair) ? pair[LANG === 'ja' ? 1 : 0] : pair?.[LANG] || pair?.en || '');
export const icon = (kind) => `<svg class="ficon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">${ICON[kind] || ICON.photo}</svg>`;
export const formsOf = (id) => state.forms.filter((f) => f.of === id);
export const formById = (id) => state.forms.find((f) => f.id === id);
// Provenance in the present stratum describes our own reproductions (the Form layer), not the
// figure or the scene, so it is shown with the form instead of in the visitor's record.
export const isFormNote = (o) => o.kind === 'provenance' && o.stratum === 'present-2026';

// A compact badge: icon, kind and basis, with a three-step reality meter.
export function basisBadge(f) {
  const b = BASIS[f.basis] || BASIS.symbolic;
  const n = document.createElement('span');
  n.className = `basis basis-${f.basis}`;
  n.title = pick([b.en[1], b.ja[1]]);
  n.innerHTML = `${icon(f.kind)}<span class="bk"></span><span class="bb"></span><span class="meter" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= b.level ? 'on' : ''}"></i>`).join('')}</span>`;
  n.querySelector('.bk').textContent = pick(KIND[f.kind]);
  n.querySelector('.bb').textContent = pick([b.en[0], b.ja[0]]);
  return n;
}

// "How this view was made": the shown form, what it was made from, and notes on the reproduction.
export function renderForms(container, shown, { notes = [] } = {}) {
  const t = FORM_T[LANG];
  container.innerHTML = '';
  const chain = [];
  for (let f = shown; f; f = f.derivedFrom?.length ? formById(f.derivedFrom[0]) : null) chain.push(f);
  for (const [i, f] of chain.entries()) {
    const row = el('div', 'frow');
    const head = el('div', 'fhead');
    if (i > 0) head.append(el('span', 'fmade', `${t.madeFrom} ↓`));
    head.append(basisBadge(f));
    row.append(head);
    if (pick(f.label) !== pick(KIND[f.kind])) row.append(el('div', 'flabel', pick(f.label)));
    const b = BASIS[f.basis];
    row.append(el('div', 'src', pick([b.en[1], b.ja[1]])));
    const cap = [f.captured?.date, f.captured?.by && `${t.by} ${f.captured.by}`, f.coverage && pick(COVERAGE[f.coverage])].filter(Boolean).join(' · ');
    if (cap) row.append(el('div', 'src', cap));
    if (f.captured?.method) row.append(el('div', 'fnote', pick(f.captured.method)));
    if (f.unseen) row.append(el('div', 'funseen', `${t.unseen}: ${pick(f.unseen)}`));
    if (f.published === false) row.append(el('div', 'src', t.held));
    container.append(row);
  }
  if (notes.length) {
    container.append(el('div', 'k', t.notes));
    for (const o of notes) container.append(el('div', 'fnote', `${txt(o, 'claim')} (${o.createdAt?.slice(0, 10) || o.source?.ref || ''})`));
  }
}
export const formStrings = () => FORM_T[LANG];

export async function loadEnvelope() {
  try {
    const [e, o] = await Promise.all([fetch('/api/envelopes'), fetch(`/api/observations${LANG === 'ja' ? '?lang=ja' : ''}`, { cache: 'no-store' })]);
    if (!e.ok || !o.ok) throw new Error('no api');
    const env = await e.json();
    state.envelopes = env.envelopes; state.forms = env.forms || [];
    state.all = await o.json();
    state.canWrite = true;
  } catch {
    // Static hosting (serve.ps1): read the seed files directly, read-only.
    try {
      state.envelopes = (await (await fetch('../envelopes/index.json')).json()).envelopes;
      try { state.forms = (await (await fetch('../envelopes/forms.json')).json()).forms; } catch { state.forms = []; }
      state.all = (await (await fetch('../envelopes/observations.jsonl')).text()).split('\n').filter(Boolean).map((l) => JSON.parse(l));
      if (LANG === 'ja') {
        const ja = (await (await fetch('../envelopes/ja.json')).json()).observations || {};
        state.all = state.all.map((o) => (ja[o.id] ? { ...o, ja: { ...ja[o.id], machine: true } } : o));
      }
    } catch { /* keep whatever loaded */ }
    state.canWrite = false;
  }
  state.supersededBy = new Map(state.all.filter((o) => o.supersedes).map((o) => [o.supersedes, o]));
}

const current = (list) => list.filter((o) => !state.supersededBy.has(o.id));
function history(o) {
  const chain = [];
  let prev = o.supersedes && state.all.find((x) => x.id === o.supersedes);
  while (prev) { chain.push(prev); prev = prev.supersedes && state.all.find((x) => x.id === prev.supersedes); }
  return chain;
}
export const envelopeById = (id) => state.envelopes.find((e) => e.id === id);
export function about(id) { return current(state.all.filter((o) => o.about?.includes(id) && !isFormNote(o))); }
export function formNotes(id) { return current(state.all.filter((o) => o.about?.includes(id) && isFormNote(o))); }
export function inEnvelopes(ids) { return current(state.all.filter((o) => o.envelopes.some((e) => ids.includes(e)) && !isFormNote(o))); }
export const claimOf = (o) => txt(o, 'claim');
export const sourceOf = (o) => txt(o, 'sourceRef') || o.source?.type || '';

// Breadcrumb: museum › diorama (depicts …)
export function breadcrumb(id) {
  const name = (e) => e.name[LANG] || e.name.en;
  const parts = [];
  for (let e = envelopeById(id); e; e = e.parent && envelopeById(e.parent)) parts.unshift(e);
  const d = envelopeById(id)?.depicts && envelopeById(envelopeById(id).depicts);
  return parts.map(name).join(' › ') + (d ? tr().crumbDepicts(name(d)) : '');
}

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const chip = (text, cls = '', title = '') => { const c = el('span', `chip ${cls}`, text); if (title) c.title = title; return c; };

function renderOne(o, onCorrect) {
  const t = tr();
  const box = el('div', `obs${o.kind === 'absence' ? ' absence' : ''}`);
  if (o.kind === 'absence') box.append(el('div', 'obs-unknown', t.unknown));
  box.append(el('div', 'claim', txt(o, 'claim')));
  if (o.absence?.note || o.absence?.cause) {
    const note = txt(o, 'absenceNote');
    box.append(el('div', 'why', `${t.why}: ${human(o.absence.cause)}${note ? ` — ${note}` : ''}`));
  }
  const meta = el('div', 'chips');
  meta.append(chip(t.stratumShort[o.stratum] || o.stratum, 'stratum'));
  if (o.kind !== 'absence') meta.append(chip(human(o.kind), 'kind'));
  meta.append(chip(`${t.evidence}: ${human(o.evidence)}`, 'evidence', t.howSupported));
  meta.append(chip(`${t.standing}: ${human(o.standing?.role)}`, 'standing', o.standing?.grantedBy ? t.grantedBy(o.standing.grantedBy) : t.selfDeclared));
  if (o.perspective && o.perspective !== 'project') meta.append(chip(human(o.perspective)));
  if (o.status !== 'verified') meta.append(chip(t.unverified, 'draft'));
  if (o.protocol?.audience && o.protocol.audience !== 'public') meta.append(chip(t.only(human(o.protocol.audience)), 'draft'));
  if (LANG === 'ja' && o.ja?.machine) meta.append(chip(t.machine, '', 'Gemini による翻訳です。英語の原文が正本です。'));
  box.append(meta);
  box.append(el('div', 'src', `${human(o.source?.type)} · ${txt(o, 'sourceRef') || ''}${o.author ? t.addedBy(o.author) : ''}`));
  if (o.note) box.append(el('div', 'src', txt(o, 'note')));
  const actions = el('div', 'obs-actions');
  const past = history(o);
  if (past.length) {
    const h = el('button', 'link', t.earlier(past.length));
    const list = el('div', 'hist'); list.hidden = true;
    for (const p of past) list.append(el('div', 'src', `${p.createdAt.slice(0, 10)} · ${p.author}: ${txt(p, 'claim')}`));
    h.addEventListener('click', () => { list.hidden = !list.hidden; });
    actions.append(h); box.append(list);
  }
  if (state.canWrite && onCorrect) {
    const c = el('button', 'link', t.correct);
    c.addEventListener('click', () => onCorrect(o));
    actions.append(c);
  }
  if (actions.childNodes.length) box.insertBefore(actions, box.querySelector('.hist'));
  return box;
}

export function renderRecord(container, list, { onCorrect } = {}) {
  container.innerHTML = '';
  if (!list.length) { container.append(el('div', 'src', tr().nothing)); return; }
  for (const key of STRATA_KEYS) {
    const items = list.filter((o) => o.stratum === key);
    if (!items.length) continue;
    container.append(el('div', 'k stratum-h', tr().strata[key]));
    // Absences after statements within each stratum, so gaps read as gaps.
    for (const o of items.sort((a, b) => (a.kind === 'absence') - (b.kind === 'absence'))) container.append(renderOne(o, onCorrect));
  }
}

// ---- Add / correct form
function select(name, values, value) {
  const s = el('select'); s.name = name;
  for (const v of values) { const opt = el('option', '', human(v)); opt.value = v; if (v === value) opt.selected = true; s.append(opt); }
  return s;
}
function field(text, input) { const w = el('label', 'f'); w.append(el('span', '', text), input); return w; }

export function renderForm(container, { envelopes, about = [], onSaved }) {
  container.innerHTML = '';
  if (!state.canWrite) return;
  const t = tr();
  const details = el('details', 'add');
  const summary = el('summary', '', t.add);
  const form = el('form');
  const replacing = el('div', 'replacing'); replacing.hidden = true;
  const claim = el('textarea'); claim.name = 'claim'; claim.rows = 3; claim.required = true;
  claim.placeholder = t.claimPh;
  const kind = select('kind', SELECTS.kind, 'event');
  const stratum = select('stratum', SELECTS.stratum, 'depicted-1808');
  const evidence = select('evidence', SELECTS.evidence, 'later-account');
  const role = select('role', SELECTS.role, 'contributor');
  const grantedBy = el('input'); grantedBy.placeholder = t.grantedPh;
  const sourceType = select('sourceType', SELECTS.sourceType, 'document');
  const ref = el('input'); ref.required = true; ref.placeholder = t.refPh;
  const cause = select('cause', SELECTS.cause, 'never-collected');
  const causeNote = el('input'); causeNote.placeholder = t.causePh;
  const perspective = select('perspective', SELECTS.perspective, 'project');
  const audience = select('audience', SELECTS.audience, 'public');
  const author = el('input'); author.required = true; author.placeholder = t.namePh;
  try { author.value = localStorage.getItem('omusha.author') || ''; } catch { /* storage blocked */ }
  const absenceBox = el('div', 'grid2'); absenceBox.append(field(t.fUnknownBecause, cause), field(t.fDetail, causeNote));
  const msg = el('div', 'src', t.formNote);
  const submit = el('button', 'primary', t.save); submit.type = 'submit';
  let supersedes = null;

  const grid = el('div', 'grid2');
  grid.append(field(t.fKind, kind), field(t.fTime, stratum), field(t.fEvidence, evidence), field(t.fStanding, role),
    field(t.fSourceType, sourceType), field(t.fPerspective, perspective));
  form.append(replacing, field(t.fObservation, claim), grid, absenceBox, field(t.fSource, ref), field(t.fRecognised, grantedBy),
    el('div', 'grid2'), field(t.fAudience, audience), field(t.fName, author), submit, msg);
  const syncAbsence = () => { absenceBox.hidden = kind.value !== 'absence'; };
  kind.addEventListener('change', syncAbsence); syncAbsence();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submit.disabled = true; msg.textContent = t.saving;
    const body = {
      envelopes, about, kind: kind.value, stratum: stratum.value, claim: claim.value,
      evidence: evidence.value, standing: { role: role.value, grantedBy: grantedBy.value },
      source: { type: sourceType.value, ref: ref.value }, perspective: perspective.value,
      protocol: { audience: audience.value }, author: author.value,
      ...(kind.value === 'absence' && { absence: { cause: cause.value, note: causeNote.value } }),
      ...(supersedes && { supersedes }),
    };
    try {
      const res = await fetch('/api/observations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.failed(res.status));
      try { localStorage.setItem('omusha.author', author.value); } catch { /* ignore */ }
      msg.textContent = t.saved;
      claim.value = ''; supersedes = null; replacing.hidden = true; summary.textContent = t.add;
      await loadEnvelope();
      onSaved?.(data);
    } catch (err) {
      msg.textContent = err.message;
    } finally {
      submit.disabled = false;
    }
  });

  details.append(summary, form);
  container.append(details);
  return {
    correct(o) {
      supersedes = o.id;
      summary.textContent = t.correctTitle;
      replacing.hidden = false; replacing.textContent = t.replaces(txt(o, 'claim'));
      // A correction is written against the original wording of the record.
      claim.value = o.claim; kind.value = o.kind; stratum.value = o.stratum; evidence.value = o.evidence;
      perspective.value = o.perspective || 'project'; syncAbsence();
      details.open = true; claim.focus(); details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
  };
}
