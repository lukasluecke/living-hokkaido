// Location buildings from the content pack. "open" places glow and can be
// selected; "soon" places are visible but closed. Geometry is illustrative.
import { ISLAND, type Location } from "@/contracts";
import { material } from "@/design/tokens";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Group, Vector3 } from "three";
import type { Field } from "./field";

export function anchorPos(
  field: Field,
  l: { anchor: readonly number[] },
): [number, number, number] {
  const [x, , z] = l.anchor;
  return [x, field.groundY(x, z), z];
}

/** Unit house is 0.7 wide; scale it to the contract footprint. */
const S = ISLAND.buildingFootprint / 0.7;

function Roof({ open, color }: { open: boolean; color: string }) {
  const roof = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!roof.current) return;
    const k = Math.min(1, dt * 3);
    roof.current.position.y +=
      (0.42 + (open ? 0.55 : 0) - roof.current.position.y) * k;
    roof.current.rotation.z +=
      ((open ? -0.35 : 0) - roof.current.rotation.z) * k;
  });
  return (
    <group ref={roof} position={[0, 0.42, 0]}>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[0, 0.1, s * 0.16]}
          rotation={[s * 0.75, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.86, 0.04, 0.44]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function Building({
  kind,
  open,
  live,
}: {
  kind: string;
  open: boolean;
  live: boolean;
}) {
  const wall = live ? material.wall : material.stone;
  const roof = live ? material.roof : "#6e6a60";
  const glow = live ? 2.2 : 0.3;
  const body =
    kind === "grove" ? null : (
      <>
        <mesh
          position={[0, kind === "workshop" ? 0.17 : 0.22, 0]}
          castShadow
          receiveShadow
          scale={
            kind === "workshop"
              ? [1.25, 0.75, 1]
              : kind === "cabin"
                ? [0.8, 0.9, 0.85]
                : [1, 1, 1]
          }
        >
          <boxGeometry args={[0.7, 0.36, 0.5]} />
          <meshStandardMaterial color={wall} />
        </mesh>
        <mesh position={[0, 0.24, 0.252]}>
          <planeGeometry args={[0.14, 0.18]} />
          <meshStandardMaterial
            color="#ffe1a0"
            emissive={material.windowGlow}
            emissiveIntensity={glow}
          />
        </mesh>
      </>
    );
  return (
    <group scale={S}>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.75, 0.8, 0.06, 20]} />
        <meshStandardMaterial color="#cdb791" />
      </mesh>
      {body}
      {kind === "grove" ? (
        // open shelter on four posts
        <>
          {[
            [-0.3, -0.2],
            [0.3, -0.2],
            [-0.3, 0.2],
            [0.3, 0.2],
          ].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, 0.22, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.03, 0.44, 6]} />
              <meshStandardMaterial color={material.woodDark} />
            </mesh>
          ))}
          <Roof open={false} color={roof} />
        </>
      ) : (
        <Roof open={open} color={roof} />
      )}
    </group>
  );
}

export function PlaceMarker({
  field,
  loc,
  roofOpen,
  active,
  onSelect,
}: {
  field: Field;
  loc: Location;
  roofOpen: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const live = loc.status === "open";
  return (
    <group
      position={anchorPos(field, loc)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <Building kind={loc.building} open={roofOpen} live={live || active} />
    </group>
  );
}

/**
 * Projects each location to screen space and moves its DOM pin there.
 * Pins are plain DOM buttons rendered by the shell (keyboard and screen
 * readers work; no drei <Html> roots inside the canvas).
 */
export function PinTracker({
  field,
  locations,
  pins,
}: {
  field: Field;
  locations: Location[];
  pins: React.RefObject<Map<string, HTMLElement>>;
}) {
  const v = useRef(new Vector3());
  useFrame(({ camera, size }) => {
    for (const l of locations) {
      const el = pins.current?.get(l.id);
      if (!el) continue;
      const [x, y, z] = anchorPos(field, l);
      v.current.set(x, y + 2.4, z).project(camera);
      const hidden = v.current.z > 1;
      // Keep the whole label on screen (8px margin), so edge pins stay readable.
      const half = el.offsetWidth / 2 + 8;
      const px = Math.min(
        Math.max(((v.current.x + 1) / 2) * size.width, half),
        size.width - half,
      );
      const py = Math.min(
        Math.max(((1 - v.current.y) / 2) * size.height, el.offsetHeight + 8),
        size.height - 8,
      );
      el.style.transform = `translate(-50%, -100%) translate(${px}px, ${py}px)`;
      el.style.visibility = hidden ? "hidden" : "visible";
    }
  });
  return null;
}
