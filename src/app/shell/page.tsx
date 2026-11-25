import { defaultPack } from "@/content";
import { Shell } from "@/shell/Shell";

export const metadata = { title: "Living Hokkaido · shell" };

// Composition skeleton: every part as its HTML stub, wired through the
// shared contracts. Teammates replace part internals; this page stays.
export default function ShellPage() {
  return <Shell pack={defaultPack} />;
}
