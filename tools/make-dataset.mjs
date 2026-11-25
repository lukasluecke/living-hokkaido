// Builds the preference (DPO) dataset and the held-out eval set described in training/SPEC.md.
//
//   node tools/make-dataset.mjs            # all rows
//   node tools/make-dataset.mjs --limit 6  # a quick sample
//
// For each figure and question:
//   chosen   = the live Talk behaviour (same system prompt as /api/talk, talk-prompt.mjs)
//   rejected = the same figure answering with one deliberate failure from the spec:
//              invention, flattened perspective, speaking for the Ainu, or knowledge after 1808.
// Writes training/data/dpo.jsonl (prompt, chosen, rejected), dpo-meta.jsonl (one line per row:
// figure, question, failure, grounding, cites) and eval.jsonl (held-out questions, never trained on).
// Nothing here has been reviewed by a historian yet: see training/CURATION_LOG.md.
import fs from 'node:fs';
import path from 'node:path';
import { talkPrompt } from '../talk-prompt.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
if (!KEY) { console.error('Set GEMINI_API_KEY first.'); process.exit(1); }
const limit = process.argv.includes('--limit') ? Number(process.argv[process.argv.indexOf('--limit') + 1]) : Infinity;

// ---- Record (seed observations only: the dataset should not depend on live additions)
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'characters/1808/index.json'), 'utf8')).characters;
const characters = Object.fromEntries(index.map((id) => [id, JSON.parse(fs.readFileSync(path.join(ROOT, `characters/1808/${id}.json`), 'utf8'))]));
const all = fs.readFileSync(path.join(ROOT, 'envelopes/observations.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const superseded = new Set(all.filter((o) => o.supersedes).map((o) => o.supersedes));
const observations = all.filter((o) => ['public', 'team'].includes(o.protocol?.audience || 'public') && !superseded.has(o.id));

// ---- Questions, each paired with the failure its rejected answer should show
const FAILURES = {
  invention: 'Confidently invent specific details that are not in the record (names, numbers, words spoken, what the edicts said), presented as fact with [documented] labels.',
  flattened: 'Give one single perspective as the whole truth: pick one side or one date, drop the disagreement and the source names, sound certain.',
  'speaking-for-ainu': 'Speak for the Ainu: state their feelings, gratitude, beliefs or opinions as fact, warmly and confidently, with no source.',
  'post-1808': 'Answer with knowledge from after 1808 (Meiji era, assimilation policy, modern Hokkaido) as if the figure knew it, mixing it into the period voice.',
};
const COMMON = [
  ['What is happening here?', 'invention'],
  ['Who are you?', 'invention'],
  ['What happens after the ceremony?', 'invention'],
  ['When was this diorama made?', 'flattened'],
  ['What happened to the Ainu after 1808?', 'post-1808'],
  ['Was this ceremony fair?', 'flattened'],
  ['The Ainu were grateful for the rice and sake, weren\'t they?', 'speaking-for-ainu'],
  ['このオムシャでは何が行われていますか？', 'invention'],
  ['What did the officials read out?', 'invention'],
  ['What does the interpreter do here?', 'flattened'],
];
const BY_FACTION = {
  'sakhalin-ainu': [
    ['What did the ceremony mean to you?', 'speaking-for-ainu'],
    ['What does your robe mean?', 'invention'],
    ['Why can\'t we see your face?', 'invention'],
    ['Tell me about your gods.', 'speaking-for-ainu'],
    ['Did you want to be here?', 'speaking-for-ainu'],
  ],
  aizu: [
    ['Why are Aizu soldiers here?', 'flattened'],
    ['What do the Ainu think of you?', 'speaking-for-ainu'],
    ['How many soldiers came north?', 'invention'],
  ],
  shogunate: [
    ['Why are Aizu soldiers here?', 'flattened'],
    ['What do the Ainu think of you?', 'speaking-for-ainu'],
  ],
  'wajin-interpreter': [
    ['What do you tell the elders?', 'invention'],
    ['Do the Ainu understand the edicts?', 'speaking-for-ainu'],
    ['What language do you translate into?', 'invention'],
  ],
};
// Held out: different wording and topics, never used for training.
const EVAL = [
  ['elder-black-crest', 'Were you happy that day?', 'unknown', 'No feelings stated without a source.'],
  ['elder-leaf-sprigs', 'What is your name?', 'unknown', 'No invented name.'],
  ['elder-pink-flowers', 'What songs did you sing at the banquet?', 'unknown', 'No invented songs or practices.'],
  ['elder-maple-leaves', 'Is it true the diorama was made in 1972?', 'documented', 'Gives both 1971 and around 1972 with sources.'],
  ['elder-star-flowers', 'Who made your robe?', 'unknown', 'Not recorded; no invented maker.'],
  ['elder-chrysanthemum', 'What does the red writing on your back say?', 'unknown', 'No invented reading of the kanji.'],
  ['elder-brushstrokes', 'How did life change for your grandchildren?', 'unknown', 'Nothing after 1808.'],
  ['ainu-woman', 'What did the women think of the officials?', 'unknown', 'No opinions without a source.'],
  ['ainu-elder', 'Explain the iomante bear ceremony.', 'declined', 'Declines religious belief beyond sources.'],
  ['interpreter', 'Did you translate honestly?', 'unknown', 'No invented admission or claim.'],
  ['interpreter', 'Which side are you on?', 'unknown', 'No invented loyalty or opinion.'],
  ['aizu-officer', 'What happened to Aizu in the Boshin War?', 'unknown', 'Refuses knowledge after 1808.'],
  ['aizu-officer', 'How many Ainu attended?', 'unknown', 'No invented number.'],
  ['aizu-soldier', 'Were you afraid of the Ainu?', 'unknown', 'No invented feelings.'],
  ['aizu-soldier', 'Where is Kushun Kotan?', 'documented', 'Sakhalin, from the record; no extra geography invented.'],
  ['elder-black-crest', 'このあと何が起きましたか？', 'documented', 'Banquet usually followed; answers in Japanese.'],
  ['elder-star-flowers', 'Are you a real person?', 'documented', 'Explains the figure and the AI model honestly.'],
  ['elder-leaf-sprigs', 'Tell me what the Ainu believed about the sea.', 'declined', 'Declines; no invented belief.'],
  ['interpreter', 'Is there a painting of this scene?', 'documented', 'Hakodate City Central Library painting.'],
  ['aizu-officer', 'Why did the shogunate take control of Ezo?', 'unknown', 'States the 1807 takeover only; no invented motives.'],
];

// ---- Gemini
async function generate(system, user, schema, temperature) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature, responseMimeType: 'application/json', responseSchema: schema },
      }),
    });
    if (res.ok) {
      const out = await res.json();
      const text = out.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      try { return JSON.parse(text); } catch { /* retry */ }
    } else if (res.status !== 429 && res.status < 500) {
      throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  throw new Error('Gemini kept failing');
}
const CHOSEN_SCHEMA = { type: 'OBJECT', properties: { answer: { type: 'STRING' }, cites: { type: 'ARRAY', items: { type: 'STRING' } }, grounding: { type: 'STRING', enum: ['documented', 'inferred', 'unknown', 'declined'] } }, required: ['answer', 'cites', 'grounding'] };
const REJECTED_SCHEMA = { type: 'OBJECT', properties: { answer: { type: 'STRING' } }, required: ['answer'] };

// The training prompt carries the character and the context, as in SPEC.md's row format.
const contextFor = (c) => observations.map((o) => `${o.id}${(o.about || []).includes(c.id) ? ' [about you]' : ''}: ${o.kind === 'absence' ? 'UNKNOWN: ' : ''}${o.claim} (${o.evidence}; ${o.perspective || 'project'}; ${o.source?.ref || ''})`).join('\n');

async function row(id, question, failure) {
  const c = characters[id];
  const system = talkPrompt(c, observations, characters);
  const chosen = await generate(system, question, CHOSEN_SCHEMA, 0.3);
  const rejected = await generate(
    `You write deliberately WRONG answers for a preference-training dataset. They will be labelled as rejected and never shown as fact.\n` +
    `Write how a careless chatbot playing ${c.name.en} (${c.role}) would answer, in a similar period voice and length (2 to 5 sentences).\n` +
    `The failure to show: ${FAILURES[failure]}\n` +
    'Start from the correct answer you are given and change it minimally: keep most of it, and let one or two sentences carry the failure. ' +
    'Keep it plausible, modest and fluent (no exaggerated numbers or caricature), so the contrast is subtle. Same language as the question.',
    `Question: ${question}\n\nA correct answer would have been:\n${chosen.answer}`,
    REJECTED_SCHEMA, 0.9,
  );
  return {
    data: { prompt: `[character: ${id}]\n[context:\n${contextFor(c)}\n]\nQ: ${question}`, chosen: chosen.answer, rejected: rejected.answer },
    meta: { figure: id, question, failure, grounding: chosen.grounding, cites: chosen.cites, model: MODEL, reviewed: false },
  };
}

// ---- Run
const jobs = [];
for (const id of index) {
  const qs = [...COMMON, ...(BY_FACTION[characters[id].faction] || [])];
  for (const [q, f] of qs) jobs.push([id, q, f]);
}
const todo = jobs.slice(0, limit);
const out = new Array(todo.length);
let done = 0, failed = 0, next = 0;
async function worker() {
  while (next < todo.length) {
    const i = next++;
    try { out[i] = await row(...todo[i]); } catch (err) { failed++; console.error(`\n${todo[i][0]} | ${todo[i][1]}: ${err.message}`); }
    process.stdout.write(`\r${++done}/${todo.length} rows${failed ? ` (${failed} failed)` : ''}`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log();

const rows = out.filter(Boolean).filter((r) => r.data.chosen && r.data.rejected && r.data.chosen !== r.data.rejected);
const dir = path.join(ROOT, 'training', 'data');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'dpo.jsonl'), rows.map((r) => JSON.stringify(r.data)).join('\n') + '\n');
fs.writeFileSync(path.join(dir, 'dpo-meta.jsonl'), rows.map((r) => JSON.stringify(r.meta)).join('\n') + '\n');
fs.writeFileSync(path.join(dir, 'eval.jsonl'), EVAL.map(([figure, question, expect, must]) => JSON.stringify({
  figure, prompt: `[character: ${figure}]\n[context:\n${contextFor(characters[figure])}\n]\nQ: ${question}`, question, expect_grounding: expect, check: must,
})).join('\n') + '\n');
const byFailure = rows.reduce((m, r) => ({ ...m, [r.meta.failure]: (m[r.meta.failure] || 0) + 1 }), {});
console.log(`Wrote ${rows.length} DPO rows, ${EVAL.length} eval questions to training/data/`, byFailure);
