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

/** Rises and tilts the roof when the place opens (shared by both roofs). */
function useRoofLift(open: boolean, base: number) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const k = Math.min(1, dt * 3);
    ref.current.position.y +=
      (base + (open ? 0.55 : 0) - ref.current.position.y) * k;
    ref.current.rotation.z += ((open ? -0.35 : 0) - ref.current.rotation.z) * k;
  });
  return ref;
}

/** One band of a hip roof: a four-sided frustum, w x d at the bottom. */
function ThatchBand({
  y,
  h,
  w,
  d,
  top,
  color,
}: {
  y: number;
  h: number;
  w: number;
  d: number;
  /** Top size as a share of the bottom. */
  top: number;
  color: string;
}) {
  const r = (d / 2) * Math.SQRT2;
  return (
    <mesh position={[0, y + h / 2, 0]} scale={[w / d, 1, 1]} castShadow>
      <cylinderGeometry args={[r * top, r, h, 4, 1, false, Math.PI / 4]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

/**
 * The lake house as a chise, after Lukas's photos of the restored house at
 * the Hokkaido Museum and the 1909 Shiraoi photo on its panel (visual
 * reference only): low reed walls on posts, a steep thatched hip roof in
 * layered bands with a ridge bundle, and a small entry porch at one end
 * (`panel-entry`). Toy shapes at island scale, not a reconstruction.
 */
function Chise({ open, live }: { open: boolean; live: boolean }) {
  const reed = live ? "#c9a868" : material.stone;
  const thatch = live ? ["#9c7c46", "#c2a466"] : ["#77736a", "#827d72"];
  const post = live ? material.woodDark : "#6e6a60";
  const glow = live ? 2.2 : 0.3;
  const roof = useRoofLift(open, 0.3);
  const W = 0.66;
  const D = 0.44;
  const H = 0.3;
  const bands = [0, 1, 2, 3];
  return (
    <>
      {/* Reed walls with posts. */}
      <mesh position={[0.04, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color={reed} />
      </mesh>
      {[-W / 2, -W / 6, W / 6, W / 2].flatMap((x) =>
        [-D / 2, D / 2].map((z) => (
          <mesh key={`${x}${z}`} position={[x + 0.04, H / 2, z]}>
            <boxGeometry args={[0.025, H + 0.01, 0.025]} />
            <meshStandardMaterial color={post} />
          </mesh>
        )),
      )}
      {/* Side window, lit from the hearth inside. */}
      <mesh position={[0.18, 0.17, D / 2 + 0.002]}>
        <planeGeometry args={[0.1, 0.08]} />
        <meshStandardMaterial
          color="#ffe1a0"
          emissive={material.windowGlow}
          emissiveIntensity={glow}
        />
      </mesh>
      {/* Entry porch at the west end, with its own small roof. */}
      <mesh position={[-W / 2 - 0.07, 0.11, 0]} castShadow>
        <boxGeometry args={[0.16, 0.22, 0.2]} />
        <meshStandardMaterial color={reed} />
      </mesh>
      <mesh position={[-W / 2 - 0.1, 0.09, 0.101]}>
        <planeGeometry args={[0.06, 0.12]} />
        <meshStandardMaterial color={post} />
      </mesh>
      <group position={[-W / 2 - 0.07, 0.21, 0]}>
        <ThatchBand
          y={0}
          h={0.1}
          w={0.24}
          d={0.28}
          top={0.35}
          color={thatch[0]}
        />
      </group>
      {/* Steep hip roof in thatch bands, with a ridge bundle. */}
      <group ref={roof} position={[0, 0.3, 0]}>
        <group position={[0.04, 0, 0]}>
          {bands.map((i) => {
            const k0 = i / bands.length;
            const k1 = (i + 1) / bands.length;
            const size = (k: number) => 1 - 0.8 * k;
            return (
              <ThatchBand
                key={i}
                y={k0 * 0.5 - 0.015}
                h={0.5 / bands.length + 0.015}
                w={(W + 0.16) * size(k0) + 0.02}
                d={(D + 0.16) * size(k0) + 0.02}
                top={size(k1) / size(k0)}
                color={thatch[i % 2]}
              />
            );
          })}
          <mesh
            position={[0, 0.51, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
            <meshStandardMaterial color={thatch[1]} />
          </mesh>
        </group>
      </group>
    </>
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
  if (kind === "house")
    return (
      <group scale={S}>
        <mesh position={[0, 0.03, 0]} receiveShadow>
          <cylinderGeometry args={[0.75, 0.8, 0.06, 20]} />
          <meshStandardMaterial color="#cdb791" />
        </mesh>
        <group position={[0, 0.06, 0]}>
          <Chise open={open} live={live} />
        </group>
      </group>
    );
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
