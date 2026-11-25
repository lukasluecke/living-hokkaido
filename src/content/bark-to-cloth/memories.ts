// Curator voice memories for this pack. The one entry is a SAMPLE written by
// the team so the card can show the feature. It is not a curator, not a
// recording and not cultural content; the card labels it. Replace it with a
// real curator memory and consent record (docs/REVIEW.md).
import type { VoiceMemoryInput } from "@/contracts";

export const memories: VoiceMemoryInput[] = [
  {
    id: "sample-cloth-memory",
    placeholder: true,
    artifactId: "cloth",
    knowledgeId: "bark-to-cloth",
    title: "Sample: a curator memory goes here",
    curator: {
      name: "Sample curator",
      role: "Placeholder, not a real person",
      authorizationId: "none-sample",
    },
    lang: "ja",
    sourceId: "sample-memory-audio",
    audio: { kind: "none" },
    transcript:
      "これはサンプルです。ここには、学芸員が自分の言葉で語る思い出や背景が入ります。まだ本物の録音はありません。",
    transcriptMode: "curator-typed",
    consent: {
      recording: "pending",
      translation: "pending",
      voiceClone: "pending",
      recordId: "none-sample",
      recordedAt: "2026-11-25",
      method: "form",
    },
    translations: [
      {
        lang: "en",
        text: "This is a sample. A curator's own memory or context will go here, in their own words. There is no real recording yet.",
        voice: "none",
        provider: "sample",
        createdAt: "2026-11-25",
      },
      {
        lang: "de",
        text: "Dies ist ein Beispiel. Hier steht später die Erinnerung oder der Hintergrund einer Kuratorin oder eines Kurators, in eigenen Worten. Es gibt noch keine echte Aufnahme.",
        voice: "none",
        provider: "sample",
        createdAt: "2026-11-25",
      },
    ],
  },
];
