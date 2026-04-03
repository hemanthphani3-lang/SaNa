import React, { useRef, useEffect, useState, Component } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName } from '@pixiv/three-vrm';
import * as THREE from 'three';

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div style={{
            background: 'rgba(0,0,0,0.85)', padding: '24px', borderRadius: '12px',
            color: '#ff6b6b', textAlign: 'center', width: '320px',
            border: '1px solid rgba(255,100,100,0.4)'
          }}>
            <h3 style={{ margin: '0 0 8px' }}>⚠️ Avatar Not Found</h3>
            <p style={{ fontSize: '0.85rem', color: '#ccc', margin: 0 }}>
              Place your <code style={{ color: '#00ffff' }}>avatar.vrm</code> file inside:<br />
              <code style={{ color: '#00ffff' }}>frontend/public/models/</code>
            </p>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

// ─── Viseme → VRM Expression ──────────────────────────────────────────────────
const visemeToExpression = {
  'Neutral': VRMExpressionPresetName.Neutral,
  'A':       VRMExpressionPresetName.Aa,
  'E':       VRMExpressionPresetName.Ee,
  'I':       VRMExpressionPresetName.Ih,
  'O':       VRMExpressionPresetName.Oh,
  'U':       VRMExpressionPresetName.Ou,
  'M':       VRMExpressionPresetName.Neutral,
  'F':       VRMExpressionPresetName.Aa,
  'T':       VRMExpressionPresetName.Ee,
};

const MOUTH_EXPRS = [
  VRMExpressionPresetName.Aa,
  VRMExpressionPresetName.Ee,
  VRMExpressionPresetName.Ih,
  VRMExpressionPresetName.Oh,
  VRMExpressionPresetName.Ou,
];

// ─── Arm pose helper ──────────────────────────────────────────────────────────
function applyRestPose(vrm) {
  const humanoid = vrm.humanoid;
  if (!humanoid) return;

  const getBone = (name) => {
    // Try standard VRM v1 enum (camelCase)
    let node = humanoid.getBoneNode?.(name);
    // Try capitalized (VRM0 style)
    if (!node) {
      const capName = name.charAt(0).toUpperCase() + name.slice(1);
      node = humanoid.getBoneNode?.(capName) || humanoid.getBoneNode?.(name.toLowerCase());
    }
    // Try raw bone as fallback
    if (!node) node = humanoid.getRawBoneNode?.(name);
    return node;
  };

  const setRot = (name, x, y, z) => {
    const node = getBone(name);
    if (!node) return;
    node.rotation.set(x, y, z);
    node.rotation.order = 'XYZ';
  };

  // Natural Standing (A-Pose): Inverting signs to ensure they point down
  setRot('leftUpperArm',   0, 0, -1.4);
  setRot('leftLowerArm',   0, 0, -0.1);
  setRot('leftHand',       0, 0,  0);

  setRot('rightUpperArm',  0, 0,  1.4);
  setRot('rightLowerArm',  0, 0,  0.1);
  setRot('rightHand',      0, 0,  0);
}

// ─── VRM Model Component ──────────────────────────────────────────────────────
const VRMModel = ({ url, viseme }) => {
  const vrmRef = useRef(null);
  const { scene } = useThree();
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    // ── Abort flag: prevents double-add in React Strict Mode ──
    let cancelled = false;

    // Clean up any previously loaded VRM first
    if (vrmRef.current) {
      scene.remove(vrmRef.current.scene);
      VRMUtils.deepDispose(vrmRef.current.scene);
      vrmRef.current = null;
    }

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;   // effect was cleaned up — abort

        const vrm = gltf.userData.vrm;
        if (!vrm) { setStatus('error'); return; }

        VRMUtils.rotateVRM0(vrm);            // flip VRM0 to Three.js Y-up
        vrm.scene.position.set(0, -1.5, 0);
        vrm.scene.scale.setScalar(1.4);

        applyRestPose(vrm);                  // arms down before adding to scene

        scene.add(vrm.scene);
        vrmRef.current = vrm;
        setStatus('ready');
      },
      undefined,
      (err) => {
        if (!cancelled) { console.error('VRM Load Error:', err); setStatus('error'); }
      }
    );

    // Cleanup: mark cancelled AND remove the scene object
    return () => {
      cancelled = true;
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
        VRMUtils.deepDispose(vrmRef.current.scene);
        vrmRef.current = null;
      }
    };
  }, [url]);   // ← only re-run when url changes (not scene — scene ref is stable)

  // ─── Per-frame animation ───────────────────────────────────────────────────
  useFrame((state, delta) => {
    const vrm = vrmRef.current;
    if (!vrm) return;

    vrm.update(delta);
    applyRestPose(vrm);

    // Lip sync
    const em = vrm.expressionManager;
    if (em) {
      const target = visemeToExpression[viseme] || VRMExpressionPresetName.Neutral;
      MOUTH_EXPRS.forEach((expr) => {
        const cur = em.getValue(expr) ?? 0;
        const tgt = expr === target ? 1.0 : 0.0;
        em.setValue(expr, THREE.MathUtils.lerp(cur, tgt, 14 * delta));
      });

      // Blinking
      const t = state.clock.elapsedTime;
      const blinkTgt = Math.sin(t * 3) > 0.96 ? 1 : 0;
      const blinkCur = em.getValue(VRMExpressionPresetName.BlinkLeft) ?? 0;
      const blinkVal = THREE.MathUtils.lerp(blinkCur, blinkTgt, 20 * delta);
      em.setValue(VRMExpressionPresetName.BlinkLeft, blinkVal);
      em.setValue(VRMExpressionPresetName.BlinkRight, blinkVal);
    }

    // Idle head sway
    const head = vrm.humanoid?.getNormalizedBoneNode?.('head');
    if (head) {
      const t = state.clock.elapsedTime;
      head.rotation.y = Math.sin(t * 0.5) * 0.05;
      head.rotation.x = Math.sin(t * 0.35) * 0.025;
    }
  });

  if (status === 'loading') {
    return (
      <Html center>
        <div style={{ color: '#00ffff', background: 'rgba(0,0,0,0.6)', padding: '12px 20px', borderRadius: '8px', fontSize: '0.85rem' }}>
          Loading Avatar…
        </div>
      </Html>
    );
  }

  return null; // VRM scene is added imperatively to Three.js
};

// ─── Main Scene ───────────────────────────────────────────────────────────────
const Scene3D = ({ viseme, customization }) => {
  const avatarUrl = customization?.avatarUrl || '/models/avatar.vrm';

  return (
    <>
      <color attach="background" args={['#080a0f']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 4]} intensity={1.8} castShadow />
      <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#a0c4ff" />
      <pointLight position={[0, 1, 2]} intensity={0.5} color={customization?.skinColor || '#ffddcc'} />

      <ErrorBoundary>
        <VRMModel url={avatarUrl} viseme={viseme} />
      </ErrorBoundary>

      <ContactShadows position={[0, -1.5, 0]} opacity={0.3} scale={8} blur={2} far={3} />
    </>
  );
};

export default Scene3D;
