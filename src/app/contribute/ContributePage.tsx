"use client";
import Contributor from "@/components/Contributor";
import CuratorMemory from "@/components/CuratorMemory";

// Contributor path: source → AI draft (mock) → human review → publish or
// withdraw. Approval state stays on this page; nothing is stored.
export function ContributePage() {
  return (
    <main>
      <p>
        <a href="/">← Back to the island</a>
      </p>
      <Contributor onApproved={() => {}} />
      <CuratorMemory />
    </main>
  );
}
