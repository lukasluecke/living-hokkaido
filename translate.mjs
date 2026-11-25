// English -> Japanese for the record and the character sheets (Gemini). Used by
// tools/translate-ja.mjs for the seed and by the server for observations added later.
const GLOSSARY = [
  'Omusha → オムシャ', 'Kushun Kotan → 久春古丹（クシュンコタン）', 'Sakhalin Ainu → 樺太アイヌ', 'Ainu → アイヌ',
  'Wajin → 和人', 'Aizu clan → 会津藩', 'shogunate → 幕府', 'Ezo → 蝦夷地', 'interpreter → 通辞', 'edicts → 触書',
  'Matsumae → 松前', 'Hokkaido Museum → 北海道博物館', 'Hakodate City Central Library → 函館市中央図書館',
  'diorama → ジオラマ', 'family crest (mon) → 家紋', 'Gaussian splat → ガウシアンスプラット', 'Local Contexts TK Labels → Local Contexts の TK ラベル',
];

export async function translateJa(items, { model = process.env.GEMINI_MODEL || 'gemini-3.5-flash' } = {}) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key || !Object.keys(items).length) return {};
  const keys = Object.keys(items);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: [
        'Translate museum record entries from English into natural Japanese for a Japanese museum visitor.',
        'Register: plain, careful museum-label Japanese (である調 for statements; keep it neutral, never flowery).',
        'Translate meaning exactly. Do not add, soften or strengthen claims. Keep uncertainty words (about, around, roughly, not recorded).',
        'Keep names of documents, file names, dates and model names as they are (e.g. "The Envelope — Foundational Document", Gemini, Hyper3D).',
        `Use these terms: ${GLOSSARY.join('; ')}.`,
        'Return every key exactly once.',
      ].join('\n') }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(items) }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: { type: 'OBJECT', properties: Object.fromEntries(keys.map((k) => [k, { type: 'STRING' }])), required: keys },
      },
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const out = await res.json();
  return JSON.parse(out.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '{}');
}
