import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { ACESFilmicToneMapping, FogExp2, PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HUD } from "./HUD";
import { HAZE, HAZE_DENSITY, Plaza } from "./scene/Plaza";
import { Player } from "./scene/Player";
import { Statue } from "./scene/Statue";
import { SPIRITS } from "./spirits";

/** A soft studio environment for the gilt to reflect, dimmed to dusk. */
function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    // Lets a statue's own plinth be cut away below the clean one drawn in code.
    gl.localClippingEnabled = true;
    const pm = new PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.45;
    // Haze rather than a fog wall: the plaza stays clear, the city softens with distance.
    scene.fog = new FogExp2(HAZE, HAZE_DENSITY);
    return () => {
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

export function App() {
  return (
    <>
      <Canvas
        className="scene"
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 62, near: 0.1, far: 1000, position: [0, 1.7, 48] }}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05, localClippingEnabled: true }}
      >
        <Environment />
        <hemisphereLight args={["#5d7a70", "#120c08", 0.55]} />
        {/* Low moonlight from behind the entrance, so faces read as you walk in. */}
        <directionalLight
          position={[30, 45, 70]}
          intensity={1.1}
          color="#cfe0ff"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-45}
          shadow-camera-right={45}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
          shadow-camera-near={10}
          shadow-camera-far={200}
          shadow-bias={-0.0004}
        />
        {/* Warm sunset fill from the far end. */}
        <directionalLight position={[0, 12, -120]} intensity={0.7} color="#ff9a5a" />
        <Plaza />
        {SPIRITS.map((s) => (
          <Statue key={s.id} s={s} />
        ))}
        <Player />
      </Canvas>
      <HUD />
    </>
  );
}
