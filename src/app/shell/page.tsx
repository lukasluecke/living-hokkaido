import { defaultPack } from "@/content";
import { Shell } from "@/shell/Shell";

export const metadata = { title: "Living Hokkaido · shell" };

// Same as "/". Kept for scripts and links that use /shell (scripts/demo-video).
export default function ShellPage() {
  return <Shell pack={defaultPack} />;
}
