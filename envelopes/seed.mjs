// Writes envelopes/observations.jsonl, the seed record for the Omusha envelopes.
// Every source below is named as it really is; nothing is presented as verified.
// Run once: node envelopes/seed.mjs  (later additions are appended, never rewritten)
import fs from 'node:fs';
import path from 'node:path';

const BRIEF = 'Project brief "Omusha Diorama Interpreter" (Shaw, 2026-11-25): research summary, primary sources not yet attached';
const ENVELOPE_DOC = '"The Envelope — Foundational Document" (Shaw, 2026-11-25)';
const LABEL = 'Hokkaido Museum exhibit label, as paraphrased by a visitor (Shaw); exact wording to be checked';
const PHOTOS = 'Visitor photos of the diorama, 2026-11-25 13:03 (assets/figures/*/photo-*.jpg, not published)';
const AT = '2026-11-25T12:00:00Z';
const contributor = { role: 'contributor', grantedBy: '' };

const elders = {
  'elder-chrysanthemum': ['figure-chrysanthemum-kanji', 'White hair; white robe with blue chrysanthemums, round red cross-hatched flowers and red kanji characters.'],
  'elder-star-flowers': ['figure-star-flowers-waves', 'White hair; white robe with red, olive and navy star-shaped flowers and navy waves.'],
  'elder-leaf-sprigs': ['figure-leaf-sprigs', 'Grey hair; cream robe with navy leaf sprigs and red-brown leaves.'],
  'elder-black-crest': ['figure-black-crest', 'Dark grey hair; plain black robe with a single white family crest (mon) between the shoulders.'],
  'elder-brushstrokes': ['figure-blue-brushstrokes', 'Grey hair; pale blue-grey robe with dark and red brush strokes.'],
  'elder-pink-flowers': ['figure-pink-flowers', 'White hair; pink robe with red and navy flowers and a brown ribbon line.'],
  'elder-maple-leaves': ['figure-maple-leaves', 'Dark hair; light grey robe with red and navy maple leaves.'],
};
const elderIds = Object.keys(elders);

let n = 0;
const id = (slug) => `obs-${String(++n).padStart(3, '0')}-${slug}`;
const obs = [];
const add = (o) => obs.push({ protocol: { audience: 'public' }, status: 'unverified', author: 'Shaw', createdAt: AT, ...o });

// ---- Kushun Kotan, 1808 (what the diorama depicts)
add({ id: id('identification'), envelopes: ['kushun-kotan-1808', 'omusha-diorama'], about: ['diorama'], kind: 'event', stratum: 'depicted-1808',
  claim: 'The scene is an Omusha held by Aizu clan officials for Sakhalin Ainu at Kushun Kotan, Sakhalin, in 1808.',
  source: { type: 'label', ref: LABEL }, evidence: 'later-account', standing: { role: 'curator', grantedBy: 'Hokkaido Museum (its exhibit label)' }, perspective: 'museum' });
add({ id: id('omusha-meaning'), envelopes: ['kushun-kotan-1808'], about: ['ceremony'], kind: 'meaning', stratum: 'depicted-1808',
  claim: 'Omusha began as a greeting between acquaintances and became a political ceremony: Ainu received rice, sake and tobacco while Wajin officials read out edicts.',
  source: { type: 'project-note', ref: BRIEF }, evidence: 'later-account', standing: contributor, perspective: 'modern-scholarship',
  note: 'Needs a scholarly citation before it is shown as verified.' });
add({ id: id('banquet'), envelopes: ['kushun-kotan-1808'], about: ['ceremony'], kind: 'event', stratum: 'depicted-1808',
  claim: 'A banquet usually followed the ceremony.', source: { type: 'project-note', ref: BRIEF }, evidence: 'later-account', standing: contributor, perspective: 'modern-scholarship' });
add({ id: id('aizu-deployment'), envelopes: ['kushun-kotan-1808'], about: ['aizu-officer', 'aizu-soldier'], kind: 'contact', stratum: 'depicted-1808',
  claim: 'The shogunate took direct control of Ezo in 1807, and Aizu clan troops were deployed north in 1807–08.',
  source: { type: 'project-note', ref: BRIEF }, evidence: 'later-account', standing: contributor, perspective: 'modern-scholarship' });
add({ id: id('elders-meaning-unrecorded'), envelopes: ['kushun-kotan-1808', 'omusha-diorama'], about: ['elders', ...elderIds, 'ainu-elder', 'ainu-woman'], kind: 'absence', stratum: 'depicted-1808',
  claim: 'What the ceremony meant to the Ainu elders was not written down.',
  absence: { cause: 'never-collected', note: 'The surviving records of the Omusha were written by Wajin officials.' },
  source: { type: 'project-note', ref: ENVELOPE_DOC }, evidence: 'none', standing: contributor, perspective: 'project',
  note: '"Nothing was recorded" is a scholar\'s claim; to be confirmed by a scholar or a community body.' });
add({ id: id('transmission-suppressed'), envelopes: ['kushun-kotan-1808'], about: ['elders', 'ainu-elder', 'ainu-woman'], kind: 'absence', stratum: 'observed',
  claim: 'Much of what Ainu families might have passed down about such ceremonies was not passed on.',
  absence: { cause: 'suppressed', note: 'Ainu language and practice were later actively suppressed.' },
  source: { type: 'project-note', ref: ENVELOPE_DOC }, evidence: 'none', standing: contributor, perspective: 'project' });
add({ id: id('hakodate-painting'), envelopes: ['kushun-kotan-1808'], about: ['ceremony'], kind: 'provenance', stratum: 'observed',
  claim: 'A painting of the same 1808 Omusha at Kushun Kotan is held by the Hakodate City Central Library.',
  source: { type: 'project-note', ref: BRIEF }, evidence: 'later-account', standing: contributor, perspective: 'project',
  note: 'Not yet consulted. Its maker and date would make it a separate observation.' });

// ---- The diorama (made 1971)
add({ id: id('made-1971'), envelopes: ['omusha-diorama'], about: ['diorama'], kind: 'making', stratum: 'made-1971',
  claim: 'The diorama was built in 1971.', source: { type: 'project-note', ref: ENVELOPE_DOC }, evidence: 'later-account', standing: contributor, perspective: 'project' });
add({ id: id('made-around-1972'), envelopes: ['omusha-diorama'], about: ['diorama'], kind: 'making', stratum: 'made-1971',
  claim: 'The diorama dates from around 1972.', source: { type: 'project-note', ref: BRIEF }, evidence: 'later-account', standing: contributor, perspective: 'project',
  note: 'Conflicts with the 1971 date. Both are kept until the museum\'s records settle it.' });
add({ id: id('figure-count'), envelopes: ['omusha-diorama'], about: ['diorama'], kind: 'making', stratum: 'made-1971',
  claim: 'The diorama has roughly 40 figures: Aizu samurai (some armed), officials, an interpreter, Sakhalin Ainu elders, women and children.',
  source: { type: 'project-note', ref: BRIEF }, evidence: 'physical-trace', standing: { role: 'passerby', grantedBy: '' }, perspective: 'project' });
add({ id: id('arrangement'), envelopes: ['omusha-diorama', 'kushun-kotan-1808'], about: ['interpreter', 'elders'], kind: 'contact', stratum: 'made-1971',
  claim: 'In the diorama, a Wajin interpreter sits inside the building and the Ainu elders sit on mats in front of it, facing the officials.',
  source: { type: 'photo', ref: PHOTOS }, evidence: 'physical-trace', standing: { role: 'passerby', grantedBy: '' }, perspective: 'project' });
for (const [who, [folder, look]] of Object.entries(elders)) {
  add({ id: id(`${who}-robe`), envelopes: ['omusha-diorama'], about: [who], kind: 'appearance', stratum: 'made-1971',
    claim: `${look} Seen from behind only.`, source: { type: 'photo', ref: PHOTOS.replace('*', folder) }, evidence: 'physical-trace', standing: { role: 'passerby', grantedBy: '' }, perspective: 'project' });
}
add({ id: id('robes-meaning-unrecorded'), envelopes: ['omusha-diorama'], about: ['elders', ...elderIds], kind: 'absence', stratum: 'made-1971',
  claim: 'Why the 1971 makers dressed the seated elders in these patterned robes, and what sources they used, is not recorded here.',
  absence: { cause: 'never-collected', note: 'The makers\' notes and the museum\'s records have not been consulted.' },
  source: { type: 'project-note', ref: 'This project' }, evidence: 'none', standing: contributor, perspective: 'project' });
add({ id: id('fronts-unseen'), envelopes: ['omusha-diorama'], about: ['elders', ...elderIds], kind: 'absence', stratum: 'observed',
  claim: 'The faces and fronts of the seated elders cannot be seen from the visitor side and were not photographed.',
  absence: { cause: 'never-collected', note: 'The figures face the building, away from the glass.' },
  source: { type: 'photo', ref: PHOTOS }, evidence: 'physical-trace', standing: { role: 'passerby', grantedBy: '' }, perspective: 'project' });

// ---- Present: the reconstructions themselves (Form layer)
add({ id: id('models-fronts-invented'), envelopes: ['omusha-diorama'], about: ['elders', ...elderIds], kind: 'provenance', stratum: 'present-2026',
  claim: 'The 3D models of the seated elders are AI reconstructions (Gemini + Hyper3D). Their backs follow the photos; their bearded fronts were generated from a written description and are invented.',
  source: { type: 'inference', ref: 'assets/figures/*/turnaround.json' }, evidence: 'inference', standing: contributor, perspective: 'project' });

// ---- The museum
add({ id: id('presentation-history'), envelopes: ['hokkaido-museum', 'omusha-diorama'], about: ['diorama'], kind: 'absence', stratum: 'observed',
  claim: 'How the museum\'s presentation of this scene, and of the Ainu, has changed since 1971 is not yet recorded here.',
  absence: { cause: 'never-collected' }, source: { type: 'project-note', ref: ENVELOPE_DOC }, evidence: 'none', standing: contributor, perspective: 'project' });

// ---- Features of the diorama (nested envelopes, scale "feature"). Added after the first seed so
// earlier ids are unchanged. What is visible, what it may stand for, and what is not known.
const SPLAT = 'Gaussian splat and visitor photos of the diorama, 2026-11-25 (not published)';
const seen = { role: 'passerby', grantedBy: '' };
add({ id: id('hall-appearance'), envelopes: ['diorama-hall', 'omusha-diorama'], about: ['diorama-hall'], kind: 'appearance', stratum: 'made-1971',
  claim: 'A thatched wooden building with a raised floor stands at the centre. Officials and the interpreter sit inside it, looking out over the elders.',
  source: { type: 'scan', ref: SPLAT }, evidence: 'physical-trace', standing: seen, perspective: 'project' });
add({ id: id('hall-unrecorded'), envelopes: ['diorama-hall', 'kushun-kotan-1808'], about: ['diorama-hall'], kind: 'absence', stratum: 'depicted-1808',
  claim: 'Which building at Kushun Kotan this stands for, and what the 1971 makers based it on, is not recorded here.',
  absence: { cause: 'never-collected', note: 'The museum\'s records and the makers\' sources have not been consulted.' },
  source: { type: 'project-note', ref: 'This project' }, evidence: 'none', standing: contributor, perspective: 'project' });
add({ id: id('curtains-appearance'), envelopes: ['diorama-curtains', 'omusha-diorama'], about: ['diorama-curtains'], kind: 'appearance', stratum: 'made-1971',
  claim: 'White curtains hang across the front of the building and along the fences, each with a large black crest.',
  source: { type: 'scan', ref: SPLAT }, evidence: 'physical-trace', standing: seen, perspective: 'project' });
add({ id: id('curtains-crest'), envelopes: ['diorama-curtains', 'kushun-kotan-1808'], about: ['diorama-curtains'], kind: 'meaning', stratum: 'made-1971',
  claim: 'The crest looks like the three-leaf hollyhock (mitsuba-aoi) of the Tokugawa shogunate, which would mark the ceremony as held in the shogunate\'s name.',
  source: { type: 'inference', ref: SPLAT }, evidence: 'inference', standing: seen, perspective: 'project',
  note: 'An identification from the visitor side only. To be checked by a curator.' });
add({ id: id('tubs-appearance'), envelopes: ['diorama-tubs', 'omusha-diorama'], about: ['diorama-tubs'], kind: 'appearance', stratum: 'made-1971',
  claim: 'Small round straw-wrapped tubs stand in a row on the ground in front of the seated elders.',
  source: { type: 'scan', ref: SPLAT }, evidence: 'physical-trace', standing: seen, perspective: 'project' });
add({ id: id('tubs-meaning'), envelopes: ['diorama-tubs', 'kushun-kotan-1808'], about: ['diorama-tubs', 'ceremony'], kind: 'meaning', stratum: 'depicted-1808',
  claim: 'They may stand for the rice, sake and tobacco given to the Ainu at an Omusha.',
  source: { type: 'inference', ref: 'This project, from the record of the ceremony (obs-002)' }, evidence: 'inference', standing: seen, perspective: 'project' });
add({ id: id('troops-appearance'), envelopes: ['diorama-troops', 'omusha-diorama'], about: ['diorama-troops', 'aizu-soldier'], kind: 'appearance', stratum: 'made-1971',
  claim: 'On the left, Aizu samurai in armour sit in rows beside striped banners, some holding weapons.',
  source: { type: 'scan', ref: SPLAT }, evidence: 'physical-trace', standing: seen, perspective: 'project' });
add({ id: id('troops-unnamed'), envelopes: ['diorama-troops', 'kushun-kotan-1808'], about: ['diorama-troops'], kind: 'absence', stratum: 'depicted-1808',
  claim: 'The names of the Aizu men present at Kushun Kotan in 1808 are not recorded here.',
  absence: { cause: 'never-collected', note: 'Aizu clan records have not been consulted.' },
  source: { type: 'project-note', ref: 'This project' }, evidence: 'none', standing: contributor, perspective: 'project' });
add({ id: id('bales-appearance'), envelopes: ['diorama-bales', 'omusha-diorama'], about: ['diorama-bales'], kind: 'appearance', stratum: 'made-1971',
  claim: 'Straw bales are stacked high on the right of the scene.',
  source: { type: 'scan', ref: SPLAT }, evidence: 'physical-trace', standing: seen, perspective: 'project' });
add({ id: id('bales-unrecorded'), envelopes: ['diorama-bales', 'kushun-kotan-1808'], about: ['diorama-bales'], kind: 'absence', stratum: 'depicted-1808',
  claim: 'What the stacked bales held, and whether they were part of the gifts, is not recorded here.',
  absence: { cause: 'never-collected' }, source: { type: 'project-note', ref: 'This project' }, evidence: 'none', standing: contributor, perspective: 'project' });

// ---- The child (added 2026-11-26)
add({ id: id('child-unrecorded'), envelopes: ['kushun-kotan-1808', 'omusha-diorama'], about: ['ainu-child'], kind: 'absence', stratum: 'depicted-1808',
  claim: 'Who this child is, and what the ceremony meant to the children present, is not recorded here.',
  absence: { cause: 'never-collected', note: 'The surviving records of the Omusha were written by Wajin officials.' },
  source: { type: 'project-note', ref: ENVELOPE_DOC }, evidence: 'none', standing: contributor, perspective: 'project' });
add({ id: id('child-model'), envelopes: ['omusha-diorama'], about: ['ainu-child'], kind: 'provenance', stratum: 'present-2026',
  claim: 'The child\'s 3D model was generated on hyper3d.ai (generation 30551fbc). The reference image it was made from is not recorded here.',
  source: { type: 'project-note', ref: 'assets/figures/figure-boy-brown-robe/hyper3d-generation.txt' }, evidence: 'inference', standing: contributor, perspective: 'project',
  createdAt: '2026-11-26T03:00:00Z' });

const file = path.join(import.meta.dirname, 'observations.jsonl');
fs.writeFileSync(file, obs.map((o) => JSON.stringify(o)).join('\n') + '\n');
console.log(`${obs.length} observations -> ${file}`);
