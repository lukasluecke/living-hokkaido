import type {
  CulturalAI,
  GuardrailProvider,
  InterviewProvider,
  MediaProvider,
} from "@/domain/contracts";
export const culturalAI: CulturalAI = {
  async extract(text, source) {
    return {
      mode: "mock",
      notice:
        "Deterministic mock: first paragraph retained as an unverified claim. No AI inference or transcription.",
      value: {
        id: "contribution",
        title: "Contributor draft",
        status: "draft",
        sources: [source],
        claims: [
          {
            id: "claim-1",
            text:
              text.trim().slice(0, 1500) ||
              "No transcript supplied. Transcription is not configured.",
            citations: [
              {
                sourceId: source.id,
                locator:
                  "Contributor text, first paragraph; verification pending",
              },
            ],
          },
        ],
        activities: [],
      },
    };
  },
  async generate(k) {
    return {
      mode: "mock",
      notice:
        "Template activity for human review; not a verified cultural fact.",
      value: [
        {
          id: "source-check",
          storyId: k.id,
          question: "Which source supports this draft?",
          options: [k.sources[0].title, "An unattributed guess"],
          answer: 0,
          explanation: "Open the source and verify the claim before approval.",
          claimIds: [k.claims[0].id],
        },
      ],
    };
  },
};
const unavailable: MediaProvider = {
  async create() {
    return {
      mode: "unavailable",
      value: null,
      notice:
        "No external call. Use original placeholder geometry, text or a cut transition.",
    };
  },
};
export const elevenLabsVoice = unavailable;
export const rodin = unavailable;
export const pixVerse = unavailable;
export const interview: InterviewProvider = {
  async start() {
    return {
      mode: "mock",
      value: { transcript: "" },
      notice:
        "Voice interview unavailable. Use the guided text interview; no recording is running.",
    };
  },
};
export const guardrail: GuardrailProvider = {
  async inspect() {
    return {
      mode: "unavailable",
      value: { allowed: false },
      notice:
        "OrcaRouter is not configured. External processing is disabled; local mock remains available.",
    };
  },
};
