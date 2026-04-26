// The actual <primitive>: loads the .glb via R3F's useLoader + an explicit
// DRACOLoader so we never depend on drei's caching or default decoder paths.
// Builds a muscle-key→meshes map, hides everything that isn't a muscle, and
// recolors meshes by coverage status on every change.

import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as THREE from 'three';
import { mapMeshNameToMuscle } from './mapMeshNameToMuscle.js';
import { useCameraTween } from './useCameraTween.js';

// One DRACOLoader instance reused across loads. Decoder files are copied to
// public/draco/gltf/ at install time (see scripts/copy-draco.js).
const draco = new DRACOLoader();
draco.setDecoderPath('/draco/gltf/');

// Switch this to change the look. Default = 'clean' (recommended).
//
// 'clean'   — muscles only, head/face/skeleton hidden. Fitness-app look.
// 'no_head' — same as clean, but also hide everything above the neck.
// 'full'    — show everything. Useful if 'clean' hides too much; flip here
//             temporarily to see the raw model.
const VISUAL_STYLE = 'clean';

// Fraction of model height above which a mesh is treated as "head" for the
// 'no_head' style. Tune to taste.
const NO_HEAD_THRESHOLD = 0.86;

// Anything matching one of these substrings (case-insensitive) is hidden
// at load time. Tweak this list if mesh names differ in the user's .glb.
const HIDE_PATTERNS = [
  // Head/face — the biggest source of "looks medical/gross"
  'eye', 'eyeball', 'eyelid', 'eyelash', 'cornea', 'lens', 'iris', 'pupil', 'sclera',
  'tooth', 'teeth', 'tongue', 'gum', 'gingiva', 'lip', 'palate', 'uvula',
  'ear', 'auricle', 'cochlea', 'tympanic',
  'nose', 'nostril', 'nasal',
  'brain', 'cerebrum', 'cerebellum',

  // Bones — we want muscles, not the skeleton
  'skull', 'cranium', 'mandible', 'maxilla', 'jaw',
  'bone', 'rib_', 'ribs', 'spine', 'vertebra', 'vertebrae',
  'pelvis', 'sacrum', 'coccyx', 'ilium', 'ischium', 'pubis',
  'femur', 'tibia', 'fibula', 'patella',
  'humerus', 'radius', 'ulna', 'clavicle', 'scapula', 'sternum',
  'carpal', 'metacarpal', 'phalanx', 'phalanges',
  'tarsal', 'metatarsal', 'calcaneus',

  // Connective tissue / internals
  'tendon', 'ligament', 'cartilage', 'fascia', 'aponeurosis',
  'organ', 'heart', 'lung', 'liver', 'kidney', 'stomach', 'intestine',
  'artery', 'vein', 'vessel', 'nerve',
];

function shouldHide(name) {
  if (!name) return false;
  const n = name.toLowerCase();
  return HIDE_PATTERNS.some(p => n.includes(p));
}

function colorForCoverage(sets, target, isFocused) {
  if (isFocused) return 0xFFFFFF;
  if (!target) return 0x4a4a66;
  if (sets <= 0) return 0x393B5E;
  if (sets < target.min) return 0x6E6EFF;
  if (sets <= target.max) return 0x4ED9C0;
  return 0xFF8A5B;
}

export function AnatomyModel({ sets, focused, onSelect, targets, controlsRef }) {
  // Direct useLoader call gives us full control over the loader. We attach
  // both DRACOLoader (KHR_draco_mesh_compression) and MeshoptDecoder
  // (EXT_meshopt_compression) so the .glb decodes whatever it was authored with.
  const gltf = useLoader(GLTFLoader, '/models/anatomy.glb', (loader) => {
    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const scene = gltf.scene;

  const muscleMeshes = useMemo(() => {
    const map = new Map();

    // Pass 0: census + center/scale so the model fits in our scene.
    // Drei's <Bounds> can mis-fit when a hidden bone hangs out at world
    // coordinates far from the body — easier to just normalise here.
    let meshN = 0, pointsN = 0, skinnedN = 0, totalN = 0;
    scene.traverse(c => {
      if (c.isPoints) pointsN++;
      else if (c.isSkinnedMesh) { skinnedN++; meshN++; }
      else if (c.isMesh) meshN++;
      if (c.isMesh || c.isPoints || c.isSkinnedMesh) totalN++;
    });

    // Compute bbox AFTER first hiding any THREE.Points (Draco-corrupted
    // geometry would render as Points; we don't want those to balloon the
    // bounding box and miniaturise everything else).
    scene.traverse(c => { if (c.isPoints) c.visible = false; });

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    if (size.y > 0.01) {
      const scale = 1.6 / size.y;
      scene.scale.setScalar(scale);
      scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    }
    // Recompute Y bounds on the scaled model for the no_head threshold.
    const scaledBox = new THREE.Box3().setFromObject(scene);
    const minY = scaledBox.min.y;
    const maxY = scaledBox.max.y;
    const headCutoff = minY + (maxY - minY) * NO_HEAD_THRESHOLD;

    // Pass 1: classify + style every mesh.
    let mapped = 0, hiddenGore = 0, hiddenUnmapped = 0;
    const sample = []; // first 8 unmapped names — handy for debugging
    scene.traverse(child => {
      if (child.isPoints) { child.visible = false; return; }
      if (!child.isMesh && !child.isSkinnedMesh) return;

      if (VISUAL_STYLE !== 'full' && shouldHide(child.name)) {
        child.visible = false;
        hiddenGore++;
        return;
      }

      const key = mapMeshNameToMuscle(child.name);
      if (key) {
        if (VISUAL_STYLE === 'no_head') {
          const c = new THREE.Box3().setFromObject(child).getCenter(new THREE.Vector3());
          if (c.y > headCutoff) {
            child.visible = false;
            return;
          }
        }
        child.userData.muscleKey = key;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(child);
        child.material = new THREE.MeshStandardMaterial({
          color: 0x4a4a66, roughness: 0.55, metalness: 0.05,
        });
        mapped++;
      } else {
        if (VISUAL_STYLE !== 'full') {
          child.visible = false;
        }
        if (sample.length < 8 && child.name) sample.push(child.name);
        hiddenUnmapped++;
      }
    });

    // Always log so anyone debugging on a phone can see what happened.
    console.group('[Anatomy3D] Model loaded');
    console.log(`Children: ${totalN} total — ${meshN} mesh, ${skinnedN} skinned, ${pointsN} points`);
    console.log(`Bounds (raw): ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`);
    console.log(`Style: ${VISUAL_STYLE}`);
    console.log(`Mapped: ${mapped} muscles → ${[...map.keys()].sort().join(', ') || '(none)'}`);
    console.log(`Hidden as gore: ${hiddenGore}`);
    console.log(`Hidden as unmapped: ${hiddenUnmapped}` + (sample.length ? ` — examples: ${sample.join(', ')}` : ''));
    console.groupEnd();

    return map;
  }, [scene]);

  // Recolor on every coverage / focus change.
  useMemo(() => {
    muscleMeshes.forEach((meshes, key) => {
      const t = targets[key];
      const s = sets[key] || 0;
      const isFocused = focused === key;
      const color = colorForCoverage(s, t, isFocused);
      meshes.forEach(m => {
        m.material.color.setHex(color);
        m.material.emissive.setHex(isFocused ? color : 0x000000);
        m.material.emissiveIntensity = isFocused ? 0.35 : 0;
      });
    });
  }, [sets, focused, muscleMeshes, targets]);

  useCameraTween({ focused, muscleMeshes, controlsRef });

  return (
    <primitive
      object={scene}
      onPointerDown={(e) => {
        e.stopPropagation();
        const key = e.object.userData.muscleKey;
        if (key && onSelect) onSelect(key);
      }}
    />
  );
}
