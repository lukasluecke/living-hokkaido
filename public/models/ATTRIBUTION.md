# Original placeholder assets

room.glb: original abstract gallery geometry, created for Living Hokkaido, MIT. Not a scan, historic building, museum interior or cultural reconstruction. Artifact primitives and owl are also original illustrative geometry. No third-party assets bundled.

# Generated models (Hyper3D Rodin)

`<artifact-id>.glb` files other than room.glb were generated on 2026-11-26 with
Hyper3D Rodin Gen-2.5 (Medium, Raw mesh, about 30k faces, PBR) from short text
prompts only. No museum photos or scans were used as input. They are not museum
objects, scans or reconstructions; the Ainu objects (tonkori, canoe,
lacquer-vessel, set-bow, garment) have not been checked by a curator. The card
says so ("About this model", claims area-generated / object-generated /
garment-generated) and visitors can switch back to the code sketch.

Web version: normal, roughness, metalness, occlusion and emissive maps removed,
scaled to the sketch's size (metres, origin on the base), then
`gltf-transform optimize --compress meshopt --texture-compress webp
--texture-size 512 --simplify true --simplify-ratio 0.75`.

| File | Hyper3D generation id | Prompt (style suffix: "Stylised hand-made diorama prop, simple clean shapes, soft matte painted colours, no text, no logos, no base plate, single object, centred") |
|---|---|---|
| herring.glb | 2e94e3d6-0a4f-4aed-a4de-06c4e77194d4 | A shallow round woven straw basket full of silver herring fish. |
| saw.glb | be2700d9-b0ae-496d-975d-affc54fabde8 | A two-person crosscut timber saw with a long steel blade and a wooden handle at each end, lying on a short cut log. |
| shovel.glb | 1f899bf5-bb62-4e2b-8e8c-f8ceb38f0f6f | A plain old iron coal shovel with a wooden shaft, a few lumps of black coal in the blade, lying flat. |
| deer.glb | e50c932f-0958-4da6-9a3b-a9c716cf2d04 | One single sika deer stag standing on four legs, one head only, small antlers, brown summer coat with pale spots. |
| tonkori.glb | 3f3427f3-9d41-463c-90aa-9259e034a6c7 | A long thin flat wooden plucked string instrument lying flat: straight narrow plank-shaped body, no round bowl, no frets, five strings, plain wood, no carvings. |
| garment.glb | fde27cfa-9f1e-4810-bac1-9d8340138822 | A plain long-sleeved robe made of undecorated light brown woven plant-fibre cloth, hung on a simple wooden pole, no embroidery, no patterns, no motifs. |
| canoe.glb | b4a03e89-168c-4897-8dd2-7430d99adfc8 | A narrow dugout canoe made from one single hollowed-out tree log, no seats, no ribs, no planks, a single wooden pole inside. |
| set-bow.glb | 8f2ad0ab-5afd-43ce-af99-a111f9ee4cfa | A simple plain wooden hunting bow set low on two short wooden stakes beside a path, with a thin cord stretched across the path, no decoration. |
| lacquer-vessel.glb | 5efd8b26-48c2-4bc3-a9cf-ffedf4d935b2 | A round lidded lacquered wooden vessel, glossy black body with plain red bands, no motifs. |

Rejected first tries (not shipped): deer 2d83d342… (two heads), tonkori
1d31bd50… (lute-like bowl body), canoe 54d05ac8… (plank rowboat with seats).
