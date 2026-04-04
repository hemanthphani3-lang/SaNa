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
};

const emotionToExpression = {
  'Happy':     VRMExpressionPresetName.Happy,
  'Excited':   VRMExpressionPresetName.Happy, // VRM standard uses Happy for excitement too
  'Sad':       VRMExpressionPresetName.Sad,
  'Surprised': VRMExpressionPresetName.Surprised,
  'Angry':     VRMExpressionPresetName.Angry,
  'Neutral':   VRMExpressionPresetName.Neutral,
};

const MOUTH_EXPRS = [
  VRMExpressionPresetName.Aa,
  VRMExpressionPresetName.Ee,
  VRMExpressionPresetName.Ih,
  VRMExpressionPresetName.Oh,
  VRMExpressionPresetName.Ou,
];

const EMOTION_EXPRS = [
  VRMExpressionPresetName.Happy,
  VRMExpressionPresetName.Sad,
  VRMExpressionPresetName.Surprised,
  VRMExpressionPresetName.Angry,
];


// ─── Arm pose helper ──────────────────────────────────────────────────────────
function applyRestPose(vrm, excludeRight = false) {
  const humanoid = vrm.humanoid;
  if (!humanoid) return;

  const setRot = (name, x, y, z) => {
    const node = humanoid.getNormalizedBoneNode?.(name) || humanoid.getBoneNode?.(name);
    if (!node) return;
    node.rotation.set(x, y, z);
    node.rotation.order = 'XYZ';
  };

  // Natural Standing (A-Pose)
  setRot('leftUpperArm',   0, 0, -1.35);
  setRot('leftLowerArm',   0, 0, -0.1);
  setRot('leftHand',       0, 0, -0.1);

  if (!excludeRight) {
    setRot('rightUpperArm',  0, 0,  1.35);
    setRot('rightLowerArm',  0, 0,  0.1);
    setRot('rightHand',      0, 0,  0.1);
  }
}

// ─── VRM Model Component ──────────────────────────────────────────────────────
const VRMModel = ({ url, viseme, emotion, action, customization }) => {
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
        vrm.scene.position.set(0, -0.8, 0);
        vrm.scene.scale.setScalar(0.9);

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

  // ─── Dynamic Material Tinting ──────────────────────────────────────────────
  useEffect(() => {
    if (!vrmRef.current || !customization) return;
    
    vrmRef.current.scene.traverse((node) => {
      if (node.isMesh && node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        
        materials.forEach(mat => {
           // We check both material and node names for maximum VRM compatibility
           const query = (mat.name + " " + node.name).toLowerCase();
           
           const isClothing = query.includes('cloth') || query.includes('top') || query.includes('bottom') || query.includes('shirt') || query.includes('shoe') || query.includes('outfit') || query.includes('wear') || query.includes('dress') || query.includes('jacket') || query.includes('pant');
           const isHair = query.includes('hair');
           const isSkin = query.includes('skin') || query.includes('face') || query.includes('body');

           if (customization.clothesColor && isClothing) {
              mat.color.set(customization.clothesColor);
           }
           else if (customization.hairColor && isHair) {
              mat.color.set(customization.hairColor);
           }
           else if (customization.skinColor && isSkin) {
              mat.color.set(customization.skinColor);
           }
        });
      }
    });
  }, [customization?.skinColor, customization?.hairColor, customization?.clothesColor, status]);

  // ─── Per-frame animation ───────────────────────────────────────────────────
  useFrame((state, delta) => {
    const vrm = vrmRef.current;
    if (!vrm) return;

    vrm.update(delta);
    applyRestPose(vrm, action === 'wave'); // Don't snap right arm back to A-pose if waving

    // --- Coordinated Human Wave V2 (Smoothed) ---
    if (action === 'wave') {
      const rightUpper = vrm.humanoid?.getNormalizedBoneNode?.('rightUpperArm');
      const rightLower = vrm.humanoid?.getNormalizedBoneNode?.('rightLowerArm');
      const rightHand  = vrm.humanoid?.getNormalizedBoneNode?.('rightHand');
      
      const time = state.clock.elapsedTime;
      const waveSpeed = 7.5; // Natural speed
      
      if (rightUpper && rightLower && rightHand) {
         // 1. Smoothly lift the entire arm into position
         // Shoulder lift (Z) and forward tilt (X)
         const upperXTgt = -0.5;
         const upperZTgt = -1.25;
         rightUpper.rotation.x = THREE.MathUtils.lerp(rightUpper.rotation.x, upperXTgt, 6 * delta);
         rightUpper.rotation.z = THREE.MathUtils.lerp(rightUpper.rotation.z, upperZTgt, 6 * delta);
         
         // 2. Coordinated Wave Motion
         const sinWave = Math.sin(time * waveSpeed);
         
         // Elbow swing (Side to Side)
         const lowerZTgt = sinWave * 0.45;
         const lowerXTgt = (sinWave * 0.3) + 0.6; // Keep forearm raised
         rightLower.rotation.x = THREE.MathUtils.lerp(rightLower.rotation.x, lowerXTgt, 8 * delta);
         rightLower.rotation.z = THREE.MathUtils.lerp(rightLower.rotation.z, lowerZTgt, 8 * delta);
         
         // 3. Trailing Wrist (Lags behind for fluidity)
         const handZTgt = Math.sin(time * waveSpeed - 0.5) * 0.35;
         rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, handZTgt, 10 * delta);
         
         rightUpper.rotation.order = 'XYZ';
         rightLower.rotation.order = 'XYZ';
         rightHand.rotation.order = 'XYZ';
      }
    }

    // Lip sync & Emotional Expressions
    const em = vrm.expressionManager;
    if (em) {
      const targetViseme = visemeToExpression[viseme] || VRMExpressionPresetName.Neutral;
      const targetEmotion = emotionToExpression[emotion] || VRMExpressionPresetName.Neutral;

      // Handle Mouth (Visemes)
      MOUTH_EXPRS.forEach((expr) => {
        const cur = em.getValue(expr) ?? 0;
        const tgt = expr === targetViseme ? 1.0 : 0.0;
        em.setValue(expr, THREE.MathUtils.lerp(cur, tgt, 14 * delta));
      });

      // Handle Emotions (Exaggerate slightly for better visualization)
      EMOTION_EXPRS.forEach((expr) => {
        const cur = em.getValue(expr) ?? 0;
        let tgt = expr === targetEmotion ? 0.8 : 0.0;
        
        // If excited, crank it up!
        if (emotion === 'Excited' && expr === VRMExpressionPresetName.Happy) tgt = 1.0;

        em.setValue(expr, THREE.MathUtils.lerp(cur, tgt, 4 * delta)); // Slower transitions for emotions
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
const Scene3D = ({ viseme, emotion, action, customization }) => {
  const avatarUrl = customization?.avatarUrl || '/models/avatar.vrm';

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 4]} intensity={1.8} castShadow />
      <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#a0c4ff" />
      <pointLight position={[0, 1, 2]} intensity={0.5} color={customization?.skinColor || '#ffddcc'} />

      <ErrorBoundary>
        <VRMModel url={avatarUrl} viseme={viseme} emotion={emotion} action={action} customization={customization} />
      </ErrorBoundary>

      <ContactShadows position={[0, -0.8, 0]} opacity={0.3} scale={8} blur={2} far={3} />
    </>
  );
};

export default Scene3D;
