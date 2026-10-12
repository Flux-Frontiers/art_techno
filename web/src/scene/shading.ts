import type { MeshStandardMaterial } from "three";

/**
 * Meshy textured the craft in a pale champagne gold, about half as saturated
 * as the statues' (mean saturation 0.28 against 0.5 to 0.7). By day the sun
 * carries it; at dusk and night, with the reflections turned down and the haze
 * thick, they went grey. So their colour (and their glow after dark) is pushed
 * toward the statues' as the sky darkens, neutral black and silver staying
 * neutral, and they take a third of the plaza's haze: the air between you and
 * them is thinner than across the city's streets.
 */
export const CRAFT_SAT = { value: 1.2 };
const CRAFT_HAZE = 0.35;
/** Also used by the Core, Meshy-textured in the same pale gold, at a haze of its own. */
export function craftShading(mat: MeshStandardMaterial, haze = CRAFT_HAZE) {
  const saturate = (v: string) => `{ float lum = dot(${v}, vec3(0.2126, 0.7152, 0.0722)); ${v} = max(mix(vec3(lum), ${v}, craftSat), 0.0); }`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.craftSat = CRAFT_SAT;
    shader.fragmentShader = "uniform float craftSat;\n" + shader.fragmentShader
      .replace("#include <map_fragment>", `#include <map_fragment>\n  ${saturate("diffuseColor.rgb")}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n  ${saturate("totalEmissiveRadiance")}`)
      .replace(
        "#include <fog_fragment>",
        `#ifdef USE_FOG
  { float craftDepth = vFogDepth * ${haze.toFixed(2)};
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp(-fogDensity * fogDensity * craftDepth * craftDepth);
  #else
    float fogFactor = smoothstep(fogNear, fogFar, craftDepth);
  #endif
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor); }
#endif`,
      );
  };
  mat.customProgramCacheKey = () => `craft-v1-${haze}`;
  mat.needsUpdate = true;
}
