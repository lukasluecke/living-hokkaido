import { defaultPack } from "@/content";
import { Shell } from "@/shell/Shell";

// The visitor experience. Parts are wired through the shared contracts.
export default function Page() {
  return <Shell pack={defaultPack} />;
}
