"use client";
import { useState } from "react";
import { culturalAI, interview } from "@/integrations/mock";
import { approve, withdraw } from "@/domain/review";
import type { Knowledge, Review } from "@/domain/contracts";
export default function Contributor({
  onApproved,
}: {
  onApproved: (k: Knowledge | null) => void;
}) {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState<Knowledge | null>(null);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState<Review>({
    reviewer: "",
    provenance: false,
    accuracy: false,
    consent: false,
    activityQuality: false,
  });
  const [busy, setBusy] = useState(false);
  async function extract() {
    setBusy(true);
    try {
      const result = await culturalAI.extract(text, {
        id: "local-source",
        title: title || filename || "Untitled source",
        kind: "document",
        rights: "unknown",
        consent: "pending",
        attribution: title || "Not supplied",
        placeholder: true,
      });
      setDraft({ ...result.value, status: "review" });
      setReview({
        reviewer: "",
        provenance: false,
        accuracy: false,
        consent: false,
        activityQuality: false,
      });
      setMessage(result.notice);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="contribution">
      <div>
        <p className="eyebrow">THE CONTRIBUTOR STUDIO</p>
        <h1>
          Keep the story.
          <br />
          Keep its context.
        </h1>
        <p>Bring a source, shape a draft, and decide what can be shared.</p>
        <p className="notice">
          Local demonstration only. Use non-sensitive sample material. Files
          stay in this tab; binary files are staged by name only. Approval here
          previews the workflow and does not publish online.
        </p>
        <label>
          Source title / attribution
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDraft(null);
              onApproved(null);
            }}
          />
        </label>
        <label>
          Choose audio, interview, document or image
          <input
            type="file"
            accept=".txt,.md,.pdf,audio/*,image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 10_000_000) {
                setMessage("Please choose a file under 10 MB.");
                return;
              }
              setFilename(f.name);
              setDraft(null);
              onApproved(null);
              if (/\.(txt|md)$/i.test(f.name)) setText(await f.text());
              else {
                setText("");
                setMessage(
                  "File staged locally. Add a transcript or description below; transcription/OCR is not connected.",
                );
              }
            }}
          />
        </label>
        <label>
          Transcript or source notes
          <textarea
            rows={6}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setDraft(null);
              onApproved(null);
            }}
            placeholder="What is this object or practice? Who shared it? What may be shared, and with whom?"
          />
        </label>
        <div className="actions">
          <button disabled={!text.trim() || busy} onClick={extract}>
            Create structured draft · mock
          </button>
          <button
            className="secondary"
            onClick={async () => setMessage((await interview.start()).notice)}
          >
            Voice interview availability
          </button>
        </div>
      </div>
      <div className="review">
        <p className="eyebrow">HUMAN REVIEW</p>
        <h2>A source is a responsibility.</h2>
        {draft ? (
          <>
            <span className="badge">{draft.status}</span>
            <label>
              Review and edit the extracted claim
              <textarea
                rows={5}
                disabled={draft.status !== "review"}
                value={draft.claims[0].text}
                onChange={(e) => {
                  setDraft({
                    ...draft,
                    claims: [{ ...draft.claims[0], text: e.target.value }],
                  });
                  setReview({
                    ...review,
                    accuracy: false,
                    activityQuality: false,
                  });
                }}
              />
            </label>
            <p className="small">
              Evidence: {draft.sources[0].title} ·{" "}
              {draft.claims[0].citations[0].locator}
            </p>
            <button
              className="secondary"
              disabled={draft.status !== "review"}
              onClick={async () => {
                const result = await culturalAI.generate(draft);
                setDraft({ ...draft, activities: result.value });
                setReview({ ...review, activityQuality: false });
                setMessage(result.notice);
              }}
            >
              Propose source-linked activity · mock
            </button>
            {draft.activities.map((a) => (
              <p key={a.id}>
                {a.question} <strong>{a.options[a.answer]}</strong>
              </p>
            ))}
            <label>
              Reviewer name
              <input
                disabled={draft.status !== "review"}
                value={review.reviewer}
                onChange={(e) =>
                  setReview({ ...review, reviewer: e.target.value })
                }
              />
            </label>
            {(
              [
                ["provenance", "I checked the source and attribution"],
                ["accuracy", "I checked every claim against the source"],
                ["consent", "I have permission for this demonstration"],
                ["activityQuality", "I checked the proposed learning activity"],
              ] as const
            ).map(([key, label]) => (
              <label className="check" key={key}>
                <input
                  type="checkbox"
                  disabled={draft.status !== "review"}
                  checked={review[key]}
                  onChange={(e) =>
                    setReview({ ...review, [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
            <div className="actions">
              <button
                disabled={draft.status !== "review" || !draft.activities.length}
                onClick={() => {
                  try {
                    const ready = {
                      ...draft,
                      sources: draft.sources.map((s) => ({
                        ...s,
                        rights: review.consent
                          ? ("approved" as const)
                          : ("unknown" as const),
                        consent: review.consent
                          ? ("granted" as const)
                          : ("pending" as const),
                      })),
                    };
                    const approved = approve(ready, review);
                    setDraft(approved);
                    onApproved(approved);
                    setMessage(
                      "Approved for this local preview. Find it in the textile room.",
                    );
                  } catch (e) {
                    setMessage(
                      e instanceof Error ? e.message : "Review failed",
                    );
                  }
                }}
              >
                Approve local preview
              </button>
              <button
                className="secondary"
                onClick={() => {
                  const next = withdraw(draft);
                  setDraft(next);
                  onApproved(next);
                  setMessage("Withdrawn from this visitor preview.");
                }}
              >
                Withdraw
              </button>
            </div>
          </>
        ) : (
          <p>
            Your source-linked draft will appear here. Nothing is automatically
            approved.
          </p>
        )}
        <p role="status">{message}</p>
      </div>
    </section>
  );
}
