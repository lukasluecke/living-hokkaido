"use client";
// Real model path: a GLB from public/models, named in the artifact contract
// (model.source = { kind: "glb", url }). Authored in metres, origin on the
// base, +Y up, front to +Z; keep the node names listed in model.nodes.
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { Object3D } from "three";

export function useGlbClone(url: string, prepare?: (o: Object3D) => Object3D) {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const o = scene.clone(true);
    o.traverse((c) => {
      c.castShadow = true;
      c.receiveShadow = true;
    });
    return prepare ? prepare(o) : o;
  }, [scene, prepare]);
}

export function GlbObject({ url }: { url: string }) {
  const o = useGlbClone(url);
  return <primitive object={o} />;
}
