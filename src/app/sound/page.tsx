import { SoundLab } from "@/audio/SoundLab";

export const metadata = { title: "Living Hokkaido · sound check" };

// Developer page: listen to every cue and the ambient mix per zone and
// season, then copy the values into src/audio/manifest.ts.
export default function SoundPage() {
  return <SoundLab />;
}
