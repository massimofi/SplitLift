// The actual <primitive>: loads the .glb, builds a muscle-key→meshes map,
// hides everything that isn't a muscle (no eyeballs / teeth / bones), and
// recolors meshes by coverage status on every change.

import React, { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { mapMeshNameToMuscle } from './mapMeshNameToMuscle.js';
import { useCameraTween } from './useCameraTween.js';

// Decoder for Draco-compressed glTF. Files are copied from three's bundle to
// public/draco/gltf/ at install (see scripts/copy-draco.js) so we don't depend
// on the gstatic CDN — works on LAN demos too.
const DRACO_PATH = '/draco/gltf/';

useGLTF.preload('/models/anatomy.glb', DRACO_PATH);

// Switch this to change the look. Default = 'clean' (recommended).
//
// 'clean'   — muscles only, head/face/skeleton hidden. Fitness-app look.
// 'no_head' — same as clean, but also hide everything above the neck.
//             Body+arms+legs only. Most stylized.
// 'full'    — show everything (not recommended; for debugging mesh names).
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

// Coverage-status colors. Returns a numeric Three.js-friendly color int.
function colorForCoverage(sets, target, isFocused) {
  if (isFocused) return 0xFFFFFF;
  if (!target) return 0x4a4a66;
  if (sets <= 0) return 0x393B5E;
  if (sets < target.min) return 0x6E6EFF;
  if (sets <= target.max) return 0x4ED9C0;
  return 0xFF8A5B;
}

export function AnatomyModel({ sets, focused, onSelect, targets, controlsRef }) {
  const { scene } = useGLTF('/models/anatomy.glb', DRACO_PATH);
  const inventoryLoggedRef = useRef(false);

  // Build the muscle-key → [meshes] map ONCE per loaded scene. While we're
  // traversing, hide gore by name pattern, give every kept mesh a fresh
  // MeshStandardMaterial we can recolor without leaking, and (if 'no_head')
  // hide anything above the head threshold.
  const muscleMeshes = useMemo(() => {
    const map = new Map();

    // First pass: gather all meshes + global Y range so 'no_head' has a threshold.
    let minY = Infinity, maxY = -Infinity;
    const allMeshes = [];
    scene.traverse(child => {
      if (!child.isMesh) return;
      allMeshes.push(child);
      const box = new THREE.Box3().setFromObject(child);
      minY = Math.min(minY, box.min.y);
      maxY = Math.max(maxY, box.max.y);
    });
    const headCutoff = minY + (maxY - minY) * NO_HEAD_THRESHOLD;

    // Second pass: classify + style.
    allMeshes.forEach(child => {
      // Step 1: hide anatomical "gore" by name pattern
      if (VISUAL_STYLE !== 'full' && shouldHide(child.name)) {
        child.visible = false;
        return;
      }

      // Step 2: try to map to one of our 17 canonical muscle keys
      const key = mapMeshNameToMuscle(child.name);
      if (key) {
        // 'no_head' bonus: even if mapped, hide if center is above the cutoff
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
          color: 0x4a4a66,
          roughness: 0.55,
          metalness: 0.05,
        });
      } else {
        // Step 3: unmapped + not on the gore list — hide. Tightening the hide
        // patterns is preferred over loosening the mapper, but anything weird
        // that slips through gets caught here.
        if (VISUAL_STYLE !== 'full') child.visible = false;
      }
    });

    // Dev-only mesh inventory log so Massi can see what got mapped vs hidden.
    if (import.meta.env.DEV && !inventoryLoggedRef.current) {
      inventoryLoggedRef.current = true;
      console.group('[Anatomy3D] Mesh inventory');
      let mapped = 0, hiddenGore = 0, hiddenUnmapped = 0;
      allMeshes.forEach(c => {
        const k = mapMeshNameToMuscle(c.name);
        if (shouldHide(c.name) && VISUAL_STYLE !== 'full') {
          console.log(c.name, '→ HIDDEN (gore)');
          hiddenGore++;
        } else if (k) {
          console.log(c.name, '→ MUSCLE (', k, ')');
          mapped++;
        } else {
          console.log(c.name, '→ HIDDEN (unmapped)');
          hiddenUnmapped++;
        }
      });
      console.log(`Total: ${allMeshes.length} mesh${allMeshes.length===1?'':'es'} — ${mapped} mapped, ${hiddenGore} hidden as gore, ${hiddenUnmapped} hidden as unmapped`);
      console.log('Style:', VISUAL_STYLE);
      console.groupEnd();
    }

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

  // Camera tween whenever focused changes.
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
