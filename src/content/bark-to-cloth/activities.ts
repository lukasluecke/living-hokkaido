// Activities. The three quizzes come from src/data/story.ts unchanged.
import type { ActivityInput } from "@/contracts";
import { activities as seed } from "@/data/story";

const artifactFor: Record<string, string> = {
  material: "fiber",
  variation: "garment",
};

export const activities: ActivityInput[] = [
  ...seed.map(
    (a): ActivityInput => ({
      kind: "quiz",
      id: a.id,
      knowledgeId: a.storyId,
      title: a.question,
      claimIds: a.claimIds,
      artifactId: artifactFor[a.id],
      question: a.question,
      options: a.options,
      answer: a.answer,
      explanation: a.explanation,
    }),
  ),
  {
    kind: "weave",
    id: "weave-rows",
    knowledgeId: "bark-to-cloth",
    title: "Weave a few rows",
    claimIds: ["bark-fiber", "no-technique"],
    artifactId: "cloth",
    prompt:
      "Pass the thread over and under to fill the rows. This is a playful way to look closely, not a lesson in a real technique.",
    rows: 6,
    columns: 12,
    completion:
      "The museum describes cloth woven from inner bark fibers. Your rows are a simple illustration.",
    illustrative: true,
  },
];
