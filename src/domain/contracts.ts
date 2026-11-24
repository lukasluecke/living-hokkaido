import { z } from "zod";
export const citationSchema = z.object({
  sourceId: z.string().min(1),
  locator: z.string().min(1),
});
export const claimSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  citations: z.array(citationSchema).min(1),
});
export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url().optional(),
  kind: z.enum(["museum", "interview", "document", "image", "audio"]),
  rights: z.enum(["unknown", "restricted", "approved"]),
  consent: z.enum(["pending", "granted", "withdrawn"]),
  attribution: z.string(),
  placeholder: z.boolean(),
});
export const activitySchema = z
  .object({
    id: z.string(),
    storyId: z.string(),
    question: z.string(),
    options: z.array(z.string()).min(2),
    answer: z.number().int().nonnegative(),
    explanation: z.string(),
    claimIds: z.array(z.string()).min(1),
  })
  .refine(
    (a) => a.answer < a.options.length,
    "Answer must reference an option",
  );
export const knowledgeSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["draft", "review", "approved", "withdrawn"]),
  sources: z.array(sourceSchema).min(1),
  claims: z.array(claimSchema).min(1),
  activities: z.array(activitySchema),
  reviewer: z.string().optional(),
  reviewedAt: z.string().optional(),
});
export type Knowledge = z.infer<typeof knowledgeSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Review = {
  reviewer: string;
  provenance: boolean;
  accuracy: boolean;
  consent: boolean;
  activityQuality: boolean;
};
export type ProviderResult<T> = {
  mode: "mock" | "live" | "unavailable";
  value: T;
  notice: string;
};
export interface CulturalAI {
  extract(text: string, source: Source): Promise<ProviderResult<Knowledge>>;
  generate(knowledge: Knowledge): Promise<ProviderResult<Activity[]>>;
}
export type Asset = {
  id: string;
  kind: "glb" | "splat" | "audio" | "video";
  url: string | null;
  rights: "unknown" | "approved";
  attribution: string;
  placeholder: boolean;
};
export interface MediaProvider {
  create(prompt: string): Promise<ProviderResult<Asset | null>>;
}
export interface InterviewProvider {
  start(): Promise<ProviderResult<{ transcript: string }>>;
}
export interface GuardrailProvider {
  inspect(text: string): Promise<ProviderResult<{ allowed: boolean }>>;
}
