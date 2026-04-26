// SplitLift 3D — Three.js canvas that loads public/models/anatomy.glb,
// raycasts on tap, and tweens the camera to the selected muscle.
// Falls back gracefully (status='failed') so BodyTabV2 can switch to 2D.

const ANATOMY_GLB_URL = 'public/models/anatomy.glb';

// Map a mesh name (Z-Anatomy / BodyParts3D Latin names, etc.) to a canonical
// muscle key from window.MUSCLE_LABELS_V2. Best-effort fuzzy match — if the
// downloaded model uses different names, edit this lookup.
function mapMeshNameToMuscle(name) {
  if (!name) return null;
  const n = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const has = (s) => n.indexOf(s) !== -1;

  // Order matters — more specific matches first.
  if (has('deltoid_posterior') || has('rear_delt') || has('posterior_deltoid')) return 'rear_delt';
  if (has('deltoid') || has('delt_clav') || has('delt_acrom')) return 'shoulder';
  if (has('pectoralis') || has('pec_major') || has('pec_min') || has('chest')) return 'chest';
  if (has('biceps_brachii') || has('biceps')) return 'biceps';
  if (has('triceps_brachii') || has('triceps')) return 'triceps';
  if (has('brachioradialis') || has('flexor_carpi') || has('extensor_carpi') || has('forearm')) return 'forearm';
  if (has('latissimus') || has('lats')) return 'lats';
  if (has('trapezius') || has('traps')) return 'traps';
  if (has('erector_spinae') || has('lower_back') || has('multifidus')) return 'lower_back';
  if (has('rectus_abdominis') || has('abs') || has('abdominis')) return 'abs';
  if (has('obliques') || has('oblique')) return 'obliques';
  if (has('gluteus') || has('glute')) return 'glutes';
  if (has('biceps_femoris') || has('semimembranosus') || has('semitendinosus') || has('hamstring') || has('hams')) return 'hams';
  if (has('quadriceps') || has('vastus') || has('rectus_femoris') || has('quad')) return 'quads';
  if (has('gastrocnemius') || has('soleus') || has('calf') || has('calves')) return 'calves';
  if (has('iliopsoas') || has('hip_flex') || has('psoas')) return 'hip_flex';
  if (has('adductor')) return 'adductors';
  return null;
}

// Coverage status colors. Returns numeric Three.js-friendly colors.
function colorForCoverage(sets, target, isFocused, isHovered) {
  if (isFocused) return 0xFFFFFF;     // bright when selected
  if (isHovered) return 0xC9C9FF;     // soft highlight on hover
  if (!target) return 0x666688;
  if (sets <= 0) return 0x393B5E;     // unworked — dark
  if (sets < target.min) return 0x6E6EFF;     // under — blue
  if (sets <= target.max) return 0x4ED9C0;    // optimal — teal
  return 0xFF8A5B;                    // over — coral
}

function statusFromCoverage(sets, target) {
  if (!target) return 'unknown';
  if (sets <= 0) return 'unworked';
  if (sets < target.min) return 'under';
  if (sets <= target.max) return 'optimal';
  return 'over';
}

// React component that mounts a Three.js scene into a div.
// Props: sets (granular coverage), focused (muscle key or null), onSelect, onStatus.
function Anatomy3DCanvas({ sets, focused, onSelect, onStatus }) {
  const containerRef = React.useRef(null);
  const refs = React.useRef({});
  const [status, setStatus] = React.useState('loading');
  const [hovered, setHovered] = React.useState(null);

  // ---- Mount the scene once ----
  React.useEffect(() => {
    const THREE = window.THREE;
    if (!THREE) {
      setStatus('failed');
      onStatus && onStatus('failed', 'Three.js not loaded');
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const w = Math.max(200, container.clientWidth);
    const h = Math.max(200, container.clientHeight);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding || 0;
    container.appendChild(renderer.domElement);

    // Lights — soft hemisphere + warm key light
    scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 0.95));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(2, 4, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9b5bff, 0.25);
    fill.position.set(-3, 1, -2);
    scene.add(fill);

    let controls = null;
    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, 1.0, 0);
      controls.minDistance = 1.4;
      controls.maxDistance = 8;
      controls.enablePan = false;
      controls.maxPolarAngle = Math.PI;
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const meshMap = new Map(); // muscleKey -> [meshes]
    let allMeshes = [];

    refs.current = { THREE, scene, camera, renderer, controls, raycaster, pointer, meshMap, allMeshes, model: null };

    // Click / tap → raycast → onSelect
    const onTap = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(allMeshes, false);
      if (hits.length === 0) return;
      const hit = hits[0].object;
      const key = hit.userData.muscleKey || mapMeshNameToMuscle(hit.name);
      if (key && onSelect) onSelect(key);
    };

    const onClick = (e) => onTap(e.clientX, e.clientY);
    const onTouchEnd = (e) => {
      // Only trigger tap if the touch didn't move much (else it's an orbit).
      const t = e.changedTouches && e.changedTouches[0];
      if (t && refs.current.touchStart) {
        const dx = Math.abs(t.clientX - refs.current.touchStart.x);
        const dy = Math.abs(t.clientY - refs.current.touchStart.y);
        if (dx < 8 && dy < 8) onTap(t.clientX, t.clientY);
      }
    };
    const onTouchStart = (e) => {
      const t = e.touches && e.touches[0];
      if (t) refs.current.touchStart = { x: t.clientX, y: t.clientY };
    };

    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });

    // Resize
    const onResize = () => {
      const w2 = Math.max(200, container.clientWidth);
      const h2 = Math.max(200, container.clientHeight);
      renderer.setSize(w2, h2);
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // Render loop
    let raf;
    const tick = () => {
      if (controls) controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Load the .glb
    if (!THREE.GLTFLoader) {
      setStatus('failed');
      onStatus && onStatus('failed', 'GLTFLoader not loaded');
    } else {
      const loader = new THREE.GLTFLoader();
      loader.load(
        ANATOMY_GLB_URL,
        (gltf) => {
          const model = gltf.scene;
          // Auto-fit: compute bounding box, scale to ~1.6 units tall, recenter.
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const scale = 1.6 / (size.y || 1);
          model.scale.setScalar(scale);
          model.position.x = -center.x * scale;
          model.position.y = -box.min.y * scale; // feet at y=0
          model.position.z = -center.z * scale;

          model.traverse(child => {
            if (child.isMesh) {
              const key = mapMeshNameToMuscle(child.name);
              if (key) {
                if (!meshMap.has(key)) meshMap.set(key, []);
                meshMap.get(key).push(child);
                child.userData.muscleKey = key;
              }
              // Use a fresh material per mesh so we can recolor without leaking.
              const baseColor = key ? colorForCoverage((sets || {})[key] || 0, (window.TARGETS_V2 || {})[key], false, false) : 0x4a4a66;
              child.material = new THREE.MeshStandardMaterial({
                color: baseColor,
                roughness: 0.55,
                metalness: 0.05,
              });
              allMeshes.push(child);
            }
          });

          scene.add(model);
          refs.current.model = model;
          refs.current.allMeshes = allMeshes;
          // Aim the camera at the torso center for a friendly default framing.
          if (controls) {
            controls.target.set(0, size.y * scale * 0.55, 0);
            controls.update();
          }
          setStatus('ready');
          onStatus && onStatus('ready');
        },
        undefined,
        (err) => {
          console.warn('[SplitLift] anatomy.glb failed to load:', err && err.message ? err.message : err);
          setStatus('failed');
          onStatus && onStatus('failed', 'Model file not found');
        }
      );
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      try {
        if (refs.current.model) {
          refs.current.model.traverse(c => {
            if (c.material) {
              if (Array.isArray(c.material)) c.material.forEach(m => m.dispose && m.dispose());
              else c.material.dispose && c.material.dispose();
            }
            if (c.geometry) c.geometry.dispose && c.geometry.dispose();
          });
          scene.remove(refs.current.model);
        }
        if (controls) controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      } catch (e) { /* ignore cleanup errors */ }
      refs.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Recolor meshes when sets / focused / hovered change ----
  React.useEffect(() => {
    if (status !== 'ready') return;
    const r = refs.current;
    if (!r.meshMap || !r.THREE) return;
    r.meshMap.forEach((meshes, key) => {
      const target = (window.TARGETS_V2 || {})[key];
      const setsCount = (sets || {})[key] || 0;
      const isFocused = focused === key;
      const isHovered = hovered === key;
      const color = colorForCoverage(setsCount, target, isFocused, isHovered);
      meshes.forEach(m => {
        if (!m.material) return;
        m.material.color = new r.THREE.Color(color);
        if (isFocused) {
          m.material.emissive = new r.THREE.Color(color);
          m.material.emissiveIntensity = 0.35;
        } else {
          m.material.emissive = new r.THREE.Color(0x000000);
          m.material.emissiveIntensity = 0;
        }
      });
    });
  }, [sets, focused, hovered, status]);

  // ---- Tween camera when focused changes ----
  React.useEffect(() => {
    if (status !== 'ready') return;
    const r = refs.current;
    if (!r.controls || !r.camera || !r.THREE) return;
    const THREE = r.THREE;

    let endTarget;
    let endCamPos;
    if (focused && r.meshMap && r.meshMap.has(focused)) {
      const meshes = r.meshMap.get(focused);
      const box = new THREE.Box3();
      meshes.forEach(m => box.expandByObject(m));
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.3);
      endTarget = center;
      // Move along current camera direction so we don't flip the user's view.
      const dir = r.camera.position.clone().sub(r.controls.target).normalize();
      endCamPos = center.clone().add(dir.multiplyScalar(Math.max(maxDim * 4.0, 1.4)));
    } else {
      // Reset to a default whole-body framing.
      const m = r.model;
      const ty = m ? new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3()).y * 0.55 : 1.0;
      endTarget = new THREE.Vector3(0, ty, 0);
      const dir = r.camera.position.clone().sub(r.controls.target).normalize();
      endCamPos = endTarget.clone().add(dir.multiplyScalar(4.2));
    }

    const startTarget = r.controls.target.clone();
    const startCamPos = r.camera.position.clone();
    const t0 = performance.now();
    let raf;
    const tweenTick = () => {
      const t = Math.min(1, (performance.now() - t0) / 700);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      r.controls.target.lerpVectors(startTarget, endTarget, ease);
      r.camera.position.lerpVectors(startCamPos, endCamPos, ease);
      r.controls.update();
      if (t < 1) raf = requestAnimationFrame(tweenTick);
    };
    raf = requestAnimationFrame(tweenTick);
    return () => cancelAnimationFrame(raf);
  }, [focused, status]);

  return (
    <div className="anatomy-3d-host" ref={containerRef}>
      {status === 'loading' && (
        <div className="a3d-status loading">
          <div className="a3d-spinner"/>
          <div className="a3d-msg">Loading 3D model…</div>
        </div>
      )}
      {status === 'failed' && (
        <div className="a3d-status failed">
          <div className="a3d-msg">3D model unavailable</div>
          <div className="a3d-sub">Drop a glTF at <code>public/models/anatomy.glb</code> to enable.</div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Anatomy3DCanvas, mapMeshNameToMuscle, colorForCoverage, statusFromCoverage });
