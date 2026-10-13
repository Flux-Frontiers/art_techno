/** The Core closes the avenue behind Ad Astra, facing the plaza (CoreTower.tsx). */
// 300 m out and 172 m tall: from the front of the processor dais (eye at z 10) its winged chip
// (72.5% up the facade) stands right behind Ad Astra's star, and its guardians read as part of the
// building, under half his apparent size.
export const CORE = { z: -300, height: 172 };

/**
 * The Sun Towers: a matched pair of Meshy towers (SunTowers.tsx), the boot-sun crown seated on a
 * setback with its bus dropping to vias below, standing in for the ring towers nearest the Core on
 * either side of the axis. From the processor they frame it like gateposts, under its height.
 * `ring` is their index in cityTowers()'s ring loop.
 */
export const SUN_TOWER = { height: 120, ring: 13 };

/**
 * Where Ad Astra's star sits right on the Core's winged chip, the Sun Towers either side: just in
 * front of the processor dais. A floor marker (Plaza.tsx, FloorMarker) shows the spot. It carries
 * the plaza's two alignments: that one looking west, and the pole tower under Polaris looking
 * north (POLE).
 */
export const ALIGN_SPOT = { x: 0, z: 10 };

/**
 * The pole tower: the round ring tower due north of the floor marker (ALIGN_SPOT), made taller,
 * whose finial (PoleFinials.tsx) stops just under Polaris as seen from that marker: stand on it,
 * face Ad Astra and the Core, turn right, and the tower points at the pole star. The marker is the
 * one spot the alignment is exact from -- Polaris is due north from anywhere, but the tower is a
 * fixed point 213 m out, so its bearing swings as you walk the avenue (about 5 degrees at the front
 * statues, 10 at the entrance). The marker sits near the middle of the four statue rows, so the
 * swing stays small where visitors stand.
 *
 * Polaris stands as high as the latitude, so the tower's height follows the sky's
 * latitude, clamped to `minLat`..`maxLat`; south of `minLat` it keeps the 40 degree height. Its
 * mirror stands due south. `ring` is its index in cityTowers()'s ring loop. `plinth` is the
 * finial's base half-width as a share of the finial's height (pole-finial.glb); the tower widens
 * with its height so its top tier carries that base.
 *
 * `below` is how far under Polaris the tip stops, in degrees. Polaris is not the pole: it stands
 * about 0.6 degrees off it and circles once a day, so its altitude runs from `lat - 0.63` to
 * `lat + 0.63`. A degree keeps the tip under the star at every hour and still reads as touching it.
 */
export const POLE = { ring: 6, minLat: 20, maxLat: 55, defaultLat: 40, below: 1, plinth: 0.11 };
