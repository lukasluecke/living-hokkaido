import assert from "node:assert/strict";
import test from "node:test";
import {
  loadContentPack,
  memoriesForArtifact,
  needsReview,
  pickTranslation,
  type VoiceMemoryInput,
  validateContentPack,
  voiceMemorySchema,
} from "@/contracts";
import { barkToClothRaw } from "@/content/bark-to-cloth";
import { translationGate } from "@/domain/voice-memory";
import { voiceMemoryProvider } from "@/integrations/voice-memory";
import {
  createElevenLabsVoiceMemory,
  srtToText,
} from "@/integrations/voice-memory/elevenlabs";
import { mockVoiceMemory } from "@/integrations/voice-memory/mock";

const memory = (over: Partial<VoiceMemoryInput> = {}): VoiceMemoryInput => ({
  id: "memory-test",
  artifactId: "cloth",
  knowledgeId: "bark-to-cloth",
  title: "Test memory",
  curator: {
    name: "Test Curator",
    role: "Test role",
    authorizationId: "auth-1",
  },
  lang: "ja",
  sourceId: "memory-test-audio",
  audio: { kind: "none" },
  transcript: "Test transcript, not cultural content.",
  consent: {
    recording: "granted",
    translation: "granted",
    voiceClone: "granted",
    recordId: "consent-1",
    recordedAt: "2026-11-25",
    method: "spoken",
  },
  translations: [
    {
      lang: "en",
      text: "Test translation.",
      voice: "cloned",
      provider: "mock",
      createdAt: "2026-11-25",
    },
  ],
  ...over,
});

const packWith = (m: VoiceMemoryInput) => {
  const p = structuredClone(barkToClothRaw) as typeof barkToClothRaw & {
    memories?: unknown[];
  };
  p.knowledge[0].sources.push({
    id: "memory-test-audio",
    title: "Test audio",
    kind: "audio",
    rights: "approved",
    consent: "granted",
    attribution: "Test",
    placeholder: false,
  });
  p.memories = [m];
  return p;
};

test("packs without memories still parse (additive default)", () => {
  const { memories: _omit, ...rest } = structuredClone(barkToClothRaw);
  assert.deepEqual(validateContentPack(rest), []);
});

test("the sample memory is a labelled placeholder and shows on the cloth", () => {
  const pack = loadContentPack(barkToClothRaw);
  const [m] = memoriesForArtifact(pack.memories, "cloth");
  assert.equal(m?.placeholder, true);
  assert.equal(m?.audio.kind, "none");
  assert.ok(m?.translations.every((t) => t.voice !== "cloned"));
  assert.equal(pickTranslation(m, ["de-DE"])?.lang, "de");
});

test("a placeholder can never use a cloned voice", () => {
  const m = memory({ placeholder: true });
  m.consent.voiceClone = "pending";
  assert.equal(voiceMemorySchema.safeParse(m).success, false);
});

test("a consented memory with a machine translation is valid", () => {
  assert.deepEqual(validateContentPack(packWith(memory())), []);
});

test("memory must point to a known artifact and an audio source", () => {
  const errors = validateContentPack(
    packWith(memory({ artifactId: "no-such-thing", sourceId: "hdm" })),
  );
  assert.ok(errors.some((e) => e.includes("no-such-thing")));
  assert.ok(errors.some((e) => e.includes("not an audio source")));
});

test("cloned voice needs voice-clone consent", () => {
  const m = memory();
  m.consent.voiceClone = "declined";
  assert.equal(voiceMemorySchema.safeParse(m).success, false);
  const stock = memory();
  stock.consent.voiceClone = "declined";
  if (stock.translations?.[0]) stock.translations[0].voice = "stock";
  assert.equal(voiceMemorySchema.safeParse(stock).success, true);
});

test("translations need translation consent", () => {
  const m = memory();
  m.consent.translation = "declined";
  assert.equal(voiceMemorySchema.safeParse(m).success, false);
});

test("prototype: Ainu translations are allowed but flagged as draft", () => {
  const m = voiceMemorySchema.parse(memory({ lang: "ain" }));
  assert.equal(needsReview(m, m.translations[0]), true);
  const mixed = voiceMemorySchema.parse(memory({ containsAinu: true }));
  assert.equal(needsReview(mixed, mixed.translations[0]), true);
  const reviewed = memory({
    lang: "ain",
    review: {
      status: "approved",
      reviewer: "Named Reviewer",
      reviewedAt: "2026-11-25",
    },
  });
  if (reviewed.translations?.[0])
    Object.assign(reviewed.translations[0], {
      mode: "human-checked",
      checkedBy: "Named Reviewer",
    });
  const r = voiceMemorySchema.parse(reviewed);
  assert.equal(needsReview(r, r.translations[0]), false);
  assert.equal(needsReview(voiceMemorySchema.parse(memory())), false);
});

test("withdrawn memories are hidden; translation picks visitor language", () => {
  const m = voiceMemorySchema.parse(memory());
  assert.equal(memoriesForArtifact([m], "cloth").length, 1);
  const w = voiceMemorySchema.parse(
    memory({ consent: { ...m.consent, recording: "withdrawn" } }),
  );
  assert.equal(memoriesForArtifact([w], "cloth").length, 0);
  assert.equal(pickTranslation(m, ["en-GB", "ja"])?.lang, "en");
  assert.equal(pickTranslation(m, ["ja-JP", "en"]), null);
  assert.equal(pickTranslation(m, ["de"]), null);
});

test("gate flags Ainu, blocks missing consent and same language", () => {
  const consent = { translation: "granted", voiceClone: "declined" } as const;
  const base = {
    sourceLang: "ja",
    targetLang: "en",
    containsAinu: false,
    consent,
  };
  assert.deepEqual(translationGate(base), {
    ok: true,
    allowClone: false,
    reviewNeeded: false,
  });
  const ainu = translationGate({ ...base, targetLang: "ain" });
  assert.ok(ainu.ok && ainu.reviewNeeded);
  const mixed = translationGate({ ...base, containsAinu: true });
  assert.ok(mixed.ok && mixed.reviewNeeded);
  assert.equal(translationGate({ ...base, targetLang: "ja-JP" }).ok, false);
  assert.equal(
    translationGate({
      ...base,
      consent: { ...consent, translation: "pending" },
    }).ok,
    false,
  );
});

test("no key selects the offline mock; mock never claims a translation", async () => {
  assert.equal(voiceMemoryProvider({}).id, "mock");
  assert.equal(
    voiceMemoryProvider({
      ELEVENLABS_API_KEY: "k",
      VOICE_MEMORY_PROVIDER: "mock",
    }).id,
    "mock",
  );
  assert.equal(
    voiceMemoryProvider({ ELEVENLABS_API_KEY: "k" }).id,
    "elevenlabs",
  );
  const r = await mockVoiceMemory.startTranslation({
    audio: new Blob(["x"]),
    sourceLang: "ja",
    targetLang: "en",
    transcript: "hello",
    containsAinu: false,
    consent: { translation: "granted", voiceClone: "granted" },
  });
  assert.equal(r.mode, "mock");
  assert.match(r.value?.result?.text ?? "", /not translated/);
  assert.equal(r.value?.result?.voice, "none");
});

test("ElevenLabs adapter turns cloning off without consent; no call without translation consent", async () => {
  const calls: { url: string; body?: FormData }[] = [];
  const fake = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body as FormData });
    return Response.json({ dubbing_id: "dub1", expected_duration_sec: 10 });
  }) as typeof fetch;
  const p = createElevenLabsVoiceMemory("key", fake);
  const r = await p.startTranslation({
    audio: new Blob(["x"]),
    sourceLang: "ja",
    targetLang: "en-US",
    transcript: "t",
    containsAinu: false,
    consent: { translation: "granted", voiceClone: "declined" },
  });
  assert.equal(r.value?.jobId, "dub1");
  assert.match(calls[0].url, /\/v1\/dubbing$/);
  assert.equal(calls[0].body?.get("disable_voice_cloning"), "true");
  assert.equal(calls[0].body?.get("target_lang"), "en");
  const blocked = await p.startTranslation({
    audio: new Blob(["x"]),
    sourceLang: "ja",
    targetLang: "en",
    transcript: "t",
    containsAinu: false,
    consent: { translation: "pending", voiceClone: "granted" },
  });
  assert.equal(blocked.value, null);
  assert.equal(calls.length, 1);
});

test("ElevenLabs adapter falls back on HTTP errors and parses SRT", async () => {
  const p = createElevenLabsVoiceMemory(
    "key",
    (async () =>
      new Response("no", { status: 401 })) as unknown as typeof fetch,
  );
  const r = await p.transcribe({ audio: new Blob(["x"]), lang: "ja" });
  assert.equal(r.mode, "unavailable");
  assert.equal(
    srtToText(
      "1\n00:00:00,000 --> 00:00:01,000\nHello\n\n2\n00:00:01,000 --> 00:00:02,000\nthere\n",
    ),
    "Hello there",
  );
});
