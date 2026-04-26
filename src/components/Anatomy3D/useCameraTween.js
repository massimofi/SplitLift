// Tween the camera target + position on every `focused` change.
// Lerps along the user's current view direction so we don't flip them around.
//
// Reads from inside <Canvas/> via useThree + useFrame. Pure custom hook, no
// tween library needed.

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULT_TARGET = new THREE.Vector3(0, 1.0, 0);
const DEFAULT_DISTANCE = 4.2;
const TWEEN_MS = 700;

export function useCameraTween({ focused, muscleMeshes, controlsRef }) {
  const { camera } = useThree();
  const startRef = useRef(null);
  const tween = useRef({ active: false });

  // When focused changes, snapshot start + compute end.
  useEffect(() => {
    if (!controlsRef.current) return;

    let endTarget;
    let endCamPos;

    if (focused && muscleMeshes && muscleMeshes.has(focused)) {
      const meshes = muscleMeshes.get(focused);
      const box = new THREE.Box3();
      meshes.forEach(m => box.expandByObject(m));
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.3);
      endTarget = center;
      const dir = camera.position.clone().sub(controlsRef.current.target).normalize();
      endCamPos = center.clone().add(dir.multiplyScalar(Math.max(maxDim * 4.0, 1.4)));
    } else {
      // Reset to default whole-body framing.
      endTarget = DEFAULT_TARGET.clone();
      const dir = camera.position.clone().sub(controlsRef.current.target).normalize();
      endCamPos = endTarget.clone().add(dir.multiplyScalar(DEFAULT_DISTANCE));
    }

    startRef.current = {
      target: controlsRef.current.target.clone(),
      camPos: camera.position.clone(),
      endTarget,
      endCamPos,
      t0: performance.now(),
    };
    tween.current.active = true;
  }, [focused, muscleMeshes, camera, controlsRef]);

  // Run the tween every frame while active.
  useFrame(() => {
    if (!tween.current.active || !startRef.current || !controlsRef.current) return;
    const s = startRef.current;
    const t = Math.min(1, (performance.now() - s.t0) / TWEEN_MS);
    const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
    controlsRef.current.target.lerpVectors(s.target, s.endTarget, ease);
    camera.position.lerpVectors(s.camPos, s.endCamPos, ease);
    if (t >= 1) tween.current.active = false;
  });
}
