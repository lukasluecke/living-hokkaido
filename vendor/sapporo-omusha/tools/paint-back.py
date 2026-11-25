# Paint a reference BACK view onto the back of a Hyper3D model's base-colour texture.
# For figures whose back Rodin textured weakly. Runs inside Blender (tested with 4.4):
#
#   blender -b --factory-startup --python tools/paint-back.py -- model-pbr.glb back.png out.glb [--flip]
#
# How: every triangle facing backwards (glTF -Z, i.e. away from the model's front) is rasterised
# in UV space, and each texel gets the colour of the back image at that point's position as seen
# from directly behind. The blend fades out as surfaces turn sideways, so the sides stay a mix and
# the front is untouched. The back image is aligned by matching the figure's silhouette bounds.
# --flip reverses the assumed facing if a model was generated pointing the other way.
import sys
import bpy
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:]
flip = '--flip' in argv
src, back_path, out_path = [a for a in argv if not a.startswith('--')][:3]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if len(meshes) != 1:
    raise SystemExit(f'Expected one mesh, found {len(meshes)}')
obj = meshes[0]
me = obj.data
me.calc_loop_triangles()

# Base-colour image of the (single) material
mat = obj.active_material
bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
link = bsdf.inputs['Base Color'].links[0]
tex_node = link.from_node
while tex_node.type != 'TEX_IMAGE':  # glTF import may put a mix/colour node in between
    tex_node = tex_node.inputs[0].links[0].from_node
img = tex_node.image
W, H = img.size
tex = np.empty(W * H * 4, dtype=np.float32)
img.pixels.foreach_get(tex)
tex = tex.reshape(H, W, 4)

ref = bpy.data.images.load(back_path)
RW, RH = ref.size
refpx = np.empty(RW * RH * 4, dtype=np.float32)
ref.pixels.foreach_get(refpx)
refpx = refpx.reshape(RH, RW, 4)
# Note: the reference is a colour (sRGB) PNG; Blender gives both images as stored values when
# their colourspaces match, so copy the reference's colourspace to the texture's to be safe.
ref.colorspace_settings.name = img.colorspace_settings.name
refpx = np.empty(RW * RH * 4, dtype=np.float32)
ref.pixels.foreach_get(refpx)
refpx = refpx.reshape(RH, RW, 4)

# Figure silhouette in the reference: pixels that differ from the background colour, which is
# sampled from the corners (generated "white" backgrounds are often light grey or slightly graded).
k = max(8, min(RW, RH) // 40)
corners = np.concatenate([refpx[:k, :k, :3].reshape(-1, 3), refpx[:k, -k:, :3].reshape(-1, 3),
                          refpx[-k:, :k, :3].reshape(-1, 3), refpx[-k:, -k:, :3].reshape(-1, 3)])
bg = np.median(corners, axis=0)
diff = np.abs(refpx[:, :, :3] - bg).max(axis=2)
mask = diff > 0.08
# Ignore stray specks: a row/column must have a run of figure pixels to count
rows = np.where(mask.sum(axis=1) > RW * 0.01)[0]
cols = np.where(mask.sum(axis=0) > RH * 0.01)[0]
ry0, ry1, rx0, rx1 = rows[0], rows[-1], cols[0], cols[-1]
print(f'Background {np.round(bg, 3)}, figure box x {rx0}-{rx1}, y {ry0}-{ry1} of {RW}x{RH}')

# World-space geometry. glTF +Z (model front) becomes Blender -Y, so the back faces +Y.
mw = obj.matrix_world
co = np.array([mw @ v.co for v in me.vertices], dtype=np.float64)
back_dir = np.array([0.0, -1.0 if flip else 1.0, 0.0])
x0, x1 = co[:, 0].min(), co[:, 0].max()
z0, z1 = co[:, 2].min(), co[:, 2].max()

uv_layer = me.uv_layers.active.data
nrm_mat = mw.to_3x3().inverted().transposed()

def ref_coords(p):
    """World points (N,3) -> reference pixel (col,row), bottom-left origin, as seen from behind."""
    # Seen from behind, the figure's +X is on the viewer's left, -X on the right (mirrored for --flip).
    t = (x1 - p[:, 0]) / (x1 - x0) if not flip else (p[:, 0] - x0) / (x1 - x0)
    s = (p[:, 2] - z0) / (z1 - z0)
    col = rx0 + t * (rx1 - rx0)
    row = ry0 + s * (ry1 - ry0)
    return np.clip(col, 0, RW - 1).astype(int), np.clip(row, 0, RH - 1).astype(int)

painted = 0
for tri in me.loop_triangles:
    n = np.array(nrm_mat @ tri.normal)
    n /= np.linalg.norm(n) or 1
    facing = float(n @ back_dir)
    if facing <= 0.1:
        continue
    weight = min(1.0, (facing - 0.1) / 0.35)
    uv = np.array([uv_layer[l].uv for l in tri.loops], dtype=np.float64) * [W, H]
    p3 = co[list(tri.vertices)]
    # Texel bounding box (+1 px margin so islands don't keep a seam of old colour)
    u0, v0 = np.floor(uv.min(axis=0)).astype(int) - 1
    u1, v1 = np.ceil(uv.max(axis=0)).astype(int) + 1
    u0, v0, u1, v1 = max(u0, 0), max(v0, 0), min(u1, W - 1), min(v1, H - 1)
    if u1 < u0 or v1 < v0:
        continue
    gu, gv = np.meshgrid(np.arange(u0, u1 + 1) + 0.5, np.arange(v0, v1 + 1) + 0.5)
    pts = np.stack([gu.ravel(), gv.ravel()], axis=1)
    a, b, c = uv
    m = np.array([[b[0] - a[0], c[0] - a[0]], [b[1] - a[1], c[1] - a[1]]])
    if abs(np.linalg.det(m)) < 1e-9:
        continue
    lb = np.linalg.solve(m, (pts - a).T).T  # (l1, l2)
    l0 = 1 - lb[:, 0] - lb[:, 1]
    inside = (l0 >= -0.05) & (lb[:, 0] >= -0.05) & (lb[:, 1] >= -0.05)
    if not inside.any():
        continue
    bary = np.stack([l0, lb[:, 0], lb[:, 1]], axis=1)[inside]
    world = bary @ p3
    col, row = ref_coords(world)
    src_rgb = refpx[row, col, :3]
    tu = np.floor(pts[inside, 0]).astype(int)
    tv = np.floor(pts[inside, 1]).astype(int)
    tex[tv, tu, :3] = tex[tv, tu, :3] * (1 - weight) + src_rgb * weight
    painted += len(tu)

img.pixels.foreach_set(tex.ravel())
img.update()
img.pack()
print(f'Painted {painted} texels from {back_path}')

bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', use_selection=False)
print(f'Wrote {out_path}')
