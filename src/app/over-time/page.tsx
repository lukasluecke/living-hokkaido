import { defaultPack } from "@/content";
import { OverTimeDemo } from "./OverTimeDemo";

export const metadata = { title: "Living Hokkaido · over time" };

// Stand-alone page for the over-time part until the shell mounts it.
// Query: ?era=<index>&season=<0-3.99> (for screenshots and links).
export default function OverTimePage() {
  return <OverTimeDemo pack={defaultPack} />;
}
