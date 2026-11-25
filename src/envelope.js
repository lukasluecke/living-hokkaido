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

export const state = { envelopes: [], all: [], supersededBy: new Map(), canWrite: false };

export async function loadEnvelope() {
  try {
    const [e, o] = await Promise.all([fetch('/api/envelopes'), fetch(`/api/observations${LANG === 'ja' ? '?lang=ja' : ''}`, { cache: 'no-store' })]);
    if (!e.ok || !o.ok) throw new Error('no api');
    state.envelopes = (await e.json()).envelopes;
    state.all = await o.json();
    state.canWrite = true;
  } catch {
    // Static hosting (serve.ps1): read the seed files directly, read-only.
    try {
      state.envelopes = (await (await fetch('../envelopes/index.json')).json()).envelopes;
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
export function about(id) { return current(state.all.filter((o) => o.about?.includes(id))); }
export function inEnvelopes(ids) { return current(state.all.filter((o) => o.envelopes.some((e) => ids.includes(e)))); }
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
