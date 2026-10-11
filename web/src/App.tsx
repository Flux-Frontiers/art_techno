import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { ACESFilmicToneMapping, Color, type DirectionalLight, FogExp2, type HemisphereLight, Object3D, PMREMGenerator, Vector3 } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HUD } from "./HUD";
import { Craft } from "./scene/Craft";
import { Plaza } from "./scene/Plaza";
import { hazeDensity, skyColors } from "./sky/plazaSky";
import { LITE } from "./device";
import { useStore } from "./store";
import { Player } from "./scene/Player";
import { NightLamps, Statue } from "./scene/Statue";
import { SPIRITS } from "./spirits";

/** A soft studio environment for the gilt to reflect, and the haze, both following the sky. */
function Environment() {
  const { gl, scene } = useThree();
  const sky = useStore((s) => s.sky);
  useEffect(() => {
    // Lets a statue's own plinth be cut away below the clean one drawn in code.
    gl.localClippingEnabled = true;
    const pm = new PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    // Haze rather than a fog wall: the plaza stays clear, the city softens with distance.
    scene.fog = new FogExp2("#1a2420", 0.0036);
    return () => {
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  useEffect(() => {
    const fog = scene.fog as FogExp2 | null;
    // The fog is the sky's horizon colour, so the two always meet without a seam.
    if (fog) {
      skyColors(sky, { zenith: new Color(), horizon: fog.color });
      fog.density = hazeDensity(sky);
    }
    // The studio reflections drop low at night (knowledge_press takes them near zero), so
    // the gilt is carried by the floodlamps at the foot rather than mirroring a
    // bright room. (This is the one control: three.js applies the scene's
    // intensity to every material without its own envMap.)
    scene.environmentIntensity = 0.14 + 0.76 * sky.daylight;
    // The studio's big low light panel sits on its +z side, which is the plaza's east: the
    // glossy paving mirrored it as a sunrise glow at every hour. Turn the studio with the
    // sun, so its glare lies where the sun really is (south at noon, behind Ad Astra at dusk).
    scene.environmentRotation.set(0, Math.atan2(sky.sunDir[0], sky.sunDir[2]), 0);
  }, [scene, sky]);
  return null;
}

/** The live clock moves: recompute the sky every half minute. */
function SkyClock() {
  const clock = useStore((s) => s.clock);
  const tick = useStore((s) => s.tickSky);
  useEffect(() => {
    if (clock !== "live") return;
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [clock, tick]);
  return null;
}

/**
 * Light from the sky: the sun by day, the moon or starlight by night (sky.ts),
 * casting the shadows when it is the sun. A fixed fill from behind the entrance
 * keeps faces readable as you walk in, and carries the shadows after dark; a
 * warm light from the sun's side glows through sunrise and sunset.
 */
function SkyLights() {
  const sky = useStore((s) => s.sky);
  const main = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const target = useMemo(() => { const o = new Object3D(); o.position.set(0, 0, -5); return o; }, []);
  const l = sky.light;
  const dir = useMemo(() => new Vector3(l.dir[0], Math.max(l.dir[1], 0.06), l.dir[2]).normalize(), [l.dir]);
  const sunSide = useMemo(() => new Vector3(sky.sunDir[0], 0.12, sky.sunDir[2]).normalize().multiplyScalar(120), [sky.sunDir]);
  const sunShadows = l.shadow > 0.01;
  useEffect(() => {
    hemi.current?.color.set("#5d7a70").lerp(new Color("#cfe2ea"), sky.daylight);
    hemi.current?.groundColor.set("#120c08").lerp(new Color("#4b4438"), sky.daylight);
  }, [sky.daylight]);
  return (
    <>
      <primitive object={target} />
      <hemisphereLight ref={hemi} intensity={0.35 + 0.7 * sky.daylight} />
      <directionalLight
        ref={main}
        target={target}
        position={[dir.x * 150, dir.y * 150 - 5, dir.z * 150 - 5]}
        color={l.color}
        intensity={l.intensity * 0.9}
        castShadow={sunShadows}
        shadow-intensity={l.shadow}
        shadow-mapSize={LITE ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={10}
        shadow-camera-far={400}
        shadow-bias={-0.0004}
      />
      {/* Fill from behind the entrance, so faces read as you walk in. */}
      <directionalLight
        position={[30, 45, 70]}
        // Softer after dark, when the floodlamps carry the statues.
        intensity={0.12 + 0.33 * sky.daylight + 0.6 * sky.warmth}
        color="#cfe0ff"
        castShadow={!sunShadows}
        shadow-mapSize={LITE ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={10}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
      />
      <directionalLight position={sunSide.toArray()} intensity={0.25 + 0.9 * sky.warmth} color="#ff9a5a" />
    </>
  );
}

export function App() {
  return (
    <>
      <Canvas
        className="scene"
        shadows
        dpr={LITE ? [1, 1.25] : [1, 1.75]}
        camera={{ fov: 62, near: 0.1, far: 1000, position: [0, 1.7, 48] }}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05, localClippingEnabled: true }}
      >
        <Environment />
        <SkyLights />
        <SkyClock />
        <NightLamps />
        <Plaza />
        <Craft />
        {SPIRITS.map((s) => (
          <Statue key={s.id} s={s} />
        ))}
        <Player />
      </Canvas>
      <HUD />
    </>
  );
}
