// Activities. The three quizzes come from src/data/story.ts unchanged.
import type { ActivityInput } from "@/contracts";
import { activities as seed } from "@/data/story";
import { activityKinds } from "./activity-kinds";

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
  {
    kind: "sequence",
    id: "make-bark-robe",
    knowledgeId: "bark-to-cloth",
    title: "From tree to robe",
    claimIds: [
      "robe-maker",
      "robe-step-peel",
      "robe-step-soften",
      "robe-step-layers",
      "robe-step-thread",
      "robe-step-weave",
      "robe-step-sew",
    ],
    artifactId: "fiber",
    prompt:
      "Put the steps of making a bark-fiber robe in order, as the Hokkaido Museum records them.",
    steps: [
      {
        id: "weave",
        label: "Weave the thread into cloth",
        claimId: "robe-step-weave",
      },
      {
        id: "peel",
        label: "Peel the bark and keep the inner bark",
        claimId: "robe-step-peel",
      },
      {
        id: "thread",
        label: "Split the layers into thread",
        claimId: "robe-step-thread",
      },
      {
        id: "soften",
        label: "Boil the inner bark until soft",
        claimId: "robe-step-soften",
      },
      {
        id: "sew",
        label: "Sew the robe and embroider it",
        claimId: "robe-step-sew",
      },
      {
        id: "layers",
        label: "Wash it and peel the fiber layers apart",
        claimId: "robe-step-layers",
      },
    ],
    order: ["peel", "soften", "layers", "thread", "weave", "sew"],
    explanation:
      "The museum records these six steps from Fujitani Rumiko of Nibutani, who learned the method from her mother.",
  },
  ...activityKinds,
];
