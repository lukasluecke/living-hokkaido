// The Envelope, client side: load envelopes and observations, resolve supersession, render the
// record by time stratum with evidence, standing and absence kept separate, and add observations.
// Observations are never edited: a correction is a new observation with `supersedes`.

const STRATA = [
  ['depicted-1808', '1808 · what the diorama depicts'],
  ['made-1971', '1971 · how the diorama was made'],
  ['observed', 'Observed since'],
  ['present-2026', '2026 · now'],
];
const STRATUM_SHORT = { 'depicted-1808': '1808', 'made-1971': '1971', observed: 'observed', 'present-2026': '2026' };
const human = (s) => String(s || '').replace(/-/g, ' ');
const SELECTS = {
  kind: ['event', 'contact', 'meaning', 'making', 'use', 'appearance', 'provenance', 'absence'],
  stratum: STRATA.map(([v]) => v),
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
    const [e, o] = await Promise.all([fetch('/api/envelopes'), fetch('/api/observations', { cache: 'no-store' })]);
    if (!e.ok || !o.ok) throw new Error('no api');
    state.envelopes = (await e.json()).envelopes;
    state.all = await o.json();
    state.canWrite = true;
  } catch {
    // Static hosting (serve.ps1): read the seed files directly, read-only.
    try {
      state.envelopes = (await (await fetch('../envelopes/index.json')).json()).envelopes;
      state.all = (await (await fetch('../envelopes/observations.jsonl')).text()).split('\n').filter(Boolean).map((l) => JSON.parse(l));
    } catch { state.envelopes = []; state.all = []; }
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

// Breadcrumb: museum › diorama (depicts …)
export function breadcrumb(id) {
  const parts = [];
  for (let e = envelopeById(id); e; e = e.parent && envelopeById(e.parent)) parts.unshift(e);
  const d = envelopeById(id)?.depicts && envelopeById(envelopeById(id).depicts);
  return parts.map((e) => e.name.en).join(' › ') + (d ? ` — depicts ${d.name.en}` : '');
}

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const chip = (text, cls = '', title = '') => { const c = el('span', `chip ${cls}`, text); if (title) c.title = title; return c; };

function renderOne(o, onCorrect) {
  const box = el('div', `obs${o.kind === 'absence' ? ' absence' : ''}`);
  if (o.kind === 'absence') box.append(el('div', 'obs-unknown', 'Unknown'));
  box.append(el('div', 'claim', o.claim));
  if (o.absence?.note || o.absence?.cause) {
    box.append(el('div', 'why', `Why: ${human(o.absence.cause)}${o.absence.note ? ` — ${o.absence.note}` : ''}`));
  }
  const meta = el('div', 'chips');
  meta.append(chip(STRATUM_SHORT[o.stratum] || o.stratum, 'stratum'));
  meta.append(chip(`evidence: ${human(o.evidence)}`, 'evidence', 'How well the claim is supported'));
  meta.append(chip(`standing: ${human(o.standing?.role)}`, 'standing', o.standing?.grantedBy ? `Granted by ${o.standing.grantedBy}` : 'Self-declared'));
  if (o.perspective && o.perspective !== 'project') meta.append(chip(human(o.perspective)));
  if (o.status !== 'verified') meta.append(chip('unverified', 'draft'));
  if (o.protocol?.audience && o.protocol.audience !== 'public') meta.append(chip(`${o.protocol.audience} only`, 'draft'));
  box.append(meta);
  box.append(el('div', 'src', `${human(o.source?.type)} · ${o.source?.ref || ''}${o.author ? ` · added by ${o.author}` : ''}`));
  if (o.note) box.append(el('div', 'src', o.note));
  const actions = el('div', 'obs-actions');
  const past = history(o);
  if (past.length) {
    const h = el('button', 'link', `Earlier version${past.length > 1 ? `s (${past.length})` : ''}`);
    const list = el('div', 'hist'); list.hidden = true;
    for (const p of past) list.append(el('div', 'src', `${p.createdAt.slice(0, 10)} · ${p.author}: ${p.claim}`));
    h.addEventListener('click', () => { list.hidden = !list.hidden; });
    actions.append(h); box.append(list);
  }
  if (state.canWrite && onCorrect) {
    const c = el('button', 'link', 'Correct this');
    c.addEventListener('click', () => onCorrect(o));
    actions.append(c);
  }
  if (actions.childNodes.length) box.insertBefore(actions, box.querySelector('.hist'));
  return box;
}

export function renderRecord(container, list, { onCorrect } = {}) {
  container.innerHTML = '';
  if (!list.length) { container.append(el('div', 'src', 'Nothing recorded yet.')); return; }
  for (const [key, title] of STRATA) {
    const items = list.filter((o) => o.stratum === key);
    if (!items.length) continue;
    container.append(el('div', 'k stratum-h', title));
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
function field(label, input) { const w = el('label', 'f'); w.append(el('span', '', label), input); return w; }

export function renderForm(container, { envelopes, about = [], onSaved }) {
  container.innerHTML = '';
  if (!state.canWrite) return;
  const details = el('details', 'add');
  const summary = el('summary', '', 'Add an observation');
  const form = el('form');
  const replacing = el('div', 'replacing'); replacing.hidden = true;
  const claim = el('textarea'); claim.name = 'claim'; claim.rows = 3; claim.required = true;
  claim.placeholder = 'What you know, or what is unknown — in plain words';
  const kind = select('kind', SELECTS.kind, 'event');
  const stratum = select('stratum', SELECTS.stratum, 'depicted-1808');
  const evidence = select('evidence', SELECTS.evidence, 'later-account');
  const role = select('role', SELECTS.role, 'contributor');
  const grantedBy = el('input'); grantedBy.placeholder = 'Recognised by (optional)';
  const sourceType = select('sourceType', SELECTS.sourceType, 'document');
  const ref = el('input'); ref.required = true; ref.placeholder = 'Citation, document, or who told you';
  const cause = select('cause', SELECTS.cause, 'never-collected');
  const causeNote = el('input'); causeNote.placeholder = 'Why it is unknown (optional detail)';
  const perspective = select('perspective', SELECTS.perspective, 'project');
  const audience = select('audience', SELECTS.audience, 'public');
  const author = el('input'); author.required = true; author.placeholder = 'Your name';
  try { author.value = localStorage.getItem('omusha.author') || ''; } catch { /* storage blocked */ }
  const absenceBox = el('div', 'grid2'); absenceBox.append(field('Unknown because', cause), field('Detail', causeNote));
  const msg = el('div', 'src');
  const submit = el('button', 'primary', 'Save observation'); submit.type = 'submit';
  let supersedes = null;

  const grid = el('div', 'grid2');
  grid.append(field('Kind', kind), field('Time', stratum), field('Evidence', evidence), field('Standing', role),
    field('Source type', sourceType), field('Perspective', perspective));
  form.append(replacing, field('Observation', claim), grid, absenceBox, field('Source', ref), field('Standing recognised by', grantedBy),
    el('div', 'grid2'), field('Who may see it', audience), field('Your name', author), submit, msg);
  const syncAbsence = () => { absenceBox.hidden = kind.value !== 'absence'; };
  kind.addEventListener('change', syncAbsence); syncAbsence();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submit.disabled = true; msg.textContent = 'Saving…';
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
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      try { localStorage.setItem('omusha.author', author.value); } catch { /* ignore */ }
      msg.textContent = 'Saved. Nothing was overwritten: the record keeps every version.';
      claim.value = ''; supersedes = null; replacing.hidden = true; summary.textContent = 'Add an observation';
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
      summary.textContent = 'Correct an observation';
      replacing.hidden = false; replacing.textContent = `Replaces: “${o.claim}”. The original stays in the history.`;
      claim.value = o.claim; kind.value = o.kind; stratum.value = o.stratum; evidence.value = o.evidence;
      perspective.value = o.perspective || 'project'; syncAbsence();
      details.open = true; claim.focus(); details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
  };
}
