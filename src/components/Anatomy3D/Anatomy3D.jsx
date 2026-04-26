// The R3F <Canvas/> wrapper. Owns lights, OrbitControls, the loading
// fallback, and the WebGL-context-lost → 2D fallback path.

import React, { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, AdaptiveEvents, Bounds, useProgress } from '@react-three/drei';
import { AnatomyModel } from './AnatomyModel.jsx';

function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="a3d-status loading">
      <div className="a3d-spinner"/>
      <div className="a3d-msg">Loading 3D model… {Math.round(progress)}%</div>
    </div>
  );
}

function FailedOverlay({ message }) {
  return (
    <div className="a3d-status failed">
      <div className="a3d-msg">3D unavailable</div>
      <div className="a3d-sub">{message || 'Falling back to 2D view.'}</div>
    </div>
  );
}

// Catches errors from useGLTF (missing file, corrupted glb, etc.) and tells
// the parent to fall back. Keep it dead simple — no telemetry.
class GLTFErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) {
    if (this.props.onFallback) this.props.onFallback(error);
  }
  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

export function Anatomy3D({ sets, targets, focused, onSelect, onFallback }) {
  const [contextLost, setContextLost] = useState(false);
  const controlsRef = useRef(null);

  if (contextLost) {
    if (onFallback) onFallback();
    return <FailedOverlay message="WebGL context lost"/>;
  }

  return (
    <div className="anatomy-3d-host">
      <Canvas
        camera={{ position: [0, 1.4, 4.2], fov: 35 }}
        dpr={[1, 1.5]}                 // cap pixel ratio on phones
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setContextLost(true);
          });
        }}
      >
        <ambientLight intensity={0.6}/>
        <hemisphereLight args={[0xffffff, 0x303040, 0.4]}/>
        <directionalLight position={[2, 4, 3]} intensity={0.85}/>
        <directionalLight position={[-3, 1, -2]} intensity={0.25} color={0x9b5bff}/>

        <AdaptiveDpr pixelated/>
        <AdaptiveEvents/>

        <GLTFErrorBoundary onFallback={onFallback}>
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.2}>
              <AnatomyModel
                sets={sets}
                focused={focused}
                onSelect={onSelect}
                targets={targets}
                controlsRef={controlsRef}
              />
            </Bounds>
          </Suspense>
        </GLTFErrorBoundary>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={1.4}
          maxDistance={8}
          target={[0, 1.0, 0]}
        />
      </Canvas>
      <LoadingOverlay/>
    </div>
  );
}
