import { createRoot } from "react-dom/client";
import { HoverView } from "./HoverView";
import { InspectView } from "./InspectView";
import { LookView } from "./LookView";
import { ModelView } from "./ModelView";

const view = new URLSearchParams(location.search).get("view") ?? "look";
const views: Record<string, () => React.JSX.Element> = {
  look: LookView,
  hover: HoverView,
  inspect: InspectView,
  model: ModelView,
};
const V = views[view] ?? LookView;

function Nav() {
  return (
    <nav style={{ position: "fixed", top: 8, right: 8, zIndex: 10, display: "flex", gap: 6, fontSize: 12 }}>
      {Object.keys(views).map((k) => (
        <a key={k} href={`?view=${k}`} style={{ color: k === view ? "#ffd27a" : "#cfc4ae", padding: "4px 8px", background: "#0008", borderRadius: 6 }}>
          {k}
        </a>
      ))}
    </nav>
  );
}

const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <>
      <Nav />
      <V />
    </>,
  );
