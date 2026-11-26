# Optional integrations and stop rules

The product is the priority. No sponsor is required for the demo or architecture. Do not shoehorn APIs for eligibility. After the core is solid, a small isolated sponsor feature is acceptable if useful and time-boxed.

| Candidate | Natural role | Current state | Fallback / stop rule |
|---|---|---|---|
| ElevenLabs | Consented synthetic narration or optional assisted interview; curator voice memories (speech-to-text, dubbing into visitor languages with a consented voice clone) | Voice memories: server adapter written against the official docs, not yet called live (no key). Mock is the default. See [VOICE-MEMORIES.md](VOICE-MEMORIES.md) | Curator-typed transcript, original audio only, translation marked "Mock, not translated"; no clone without recorded consent; Ainu content marked as draft for the review pass |
| OpenAI-compatible LLM (Z.ai / CarbonForge) | Ask the owl; source ingestion drafts cited claims and a quiz ([INGEST.md](INGEST.md)) | Server adapter `src/integrations/llm`; ingestion tested against a local fake server only | Mock draft (one claim per source sentence); claims without a verbatim source quote are dropped; human review always |
| Adaption Labs | Improve source extraction or source-grounded activity generation | Typed CulturalAI contract; deterministic mock | Manual review and template activity. Partner deck describes Adaptive Data and AutoScientist/custom models; verify actual API/product fit before committing |
| OrcaRouter | Optional external-model routing/guardrails | Unavailable; external processing denied | Local mock; never claim firewall protection is active |
| Hyper3D Rodin | Original non-sensitive scene props | No-op/null | Original primitives/GLB; never manufacture “museum scans” |
| PixVerse | Optional cinematic transition | No-op/null | Immediate scene change; no blocked navigation |
| Convex | Shared drafts, review/audit, storage | Proposed contract only | Session memory; do not claim durable storage |
| Clerk | Authenticated reviewer identity | Not configured | No production publishing endpoint |

A live adapter needs official docs and real credentials, a server-only implementation, explicit consent for data transfer, schema/evidence validation, a short timeout, cancellation, clear status, and fallback. Add provider-specific evaluation cases: supported extraction, missing evidence, conflicting source, prompt injection, revoked consent, malformed output, timeout. Source-grounded generation should not silently fill gaps. Do not claim custom training, sponsor use, accuracy gains or cost savings without actual evidence.

Decision gate: does it improve capture quality, visitor understanding or creative delivery? Can it be completed and tested in 60–90 minutes without consuming recording time? Can it fail independently? If no, drop it. Confirm partner tag eligibility in the portal only for genuinely used integrations.
