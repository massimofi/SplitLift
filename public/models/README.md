# 3D anatomy model

Drop a glTF binary at `public/models/anatomy.glb` to enable the 3D Body tab.
Without this file, the Body tab silently falls back to the detailed 2D anatomy
SVG (front + back) — the demo still works.

## Recommended source

**Z-Anatomy "Myology"** by Gauthier Kervyn — CC-BY-SA 4.0

- https://sketchfab.com/3d-models/myology-31b40fd809b14665b93773936d67c52c
- Sign in to Sketchfab, choose **Download → glTF (.glb)**

If the download is over ~25 MB, decimate before committing:

- https://gltf.report/ — drop the file, reduce mesh complexity, re-export
- Blender — `File → Import → glTF`, select object, `Modifiers → Decimate`, export

## Mesh-name convention

`splitlift-3d.jsx` does fuzzy matching on the mesh names inside the .glb to bind
each mesh to one of these canonical muscle keys:

```
chest, shoulder, rear_delt, biceps, triceps, forearm,
abs, obliques, lats, traps, lower_back,
quads, hams, glutes, calves, hip_flex, adductors
```

Z-Anatomy's Latin names (`Pectoralis_major_left`, `Biceps_brachii_right`, …)
are auto-mapped. If a different model is used, edit `mapMeshNameToMuscle()` in
`splitlift-3d.jsx`.

To inspect what mesh names a model has, drop in a model and run in DevTools:

```js
window.__inspect_anatomy = () => {
  const r = document.querySelector('.anatomy-3d-host');
  // (see splitlift-3d.jsx for traverse logic — names are logged on load)
};
```

## License attribution (REQUIRED)

If you ship the Z-Anatomy `.glb`:

1. Keep this file in the repo.
2. Add a `LICENSE-MODEL.txt` next to `anatomy.glb` containing:
   - "Anatomical mesh: Z-Anatomy Myology by Gauthier Kervyn — CC-BY-SA 4.0"
   - "https://www.z-anatomy.com — original CC-BY-SA license"
3. Credit Z-Anatomy and the BodyParts3D project (Database Center for Life Science, Japan) in `README.md → Credits` (already pre-listed there).

Per CC-BY-SA: redistributing the model means SplitLift either inherits a
compatible license OR distributes the model under CC-BY-SA separately. The
simpler path for this repo is the latter — keep the app license open and
LICENSE-MODEL.txt scopes only the .glb.
