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
 * front of the processor dais. A floor marker (Plaza.tsx, FloorMarker) shows the spot.
 */
export const ALIGN_SPOT = { x: 0, z: 10 };

/**
 * The pole tower: the round ring tower due north of the entrance, made taller, whose long needle
 * stops just under Polaris as seen from where visitors arrive (turn right on entering and it points
 * at the pole star). Polaris stands as high as the latitude, so the tower's height follows the sky's
 * latitude, clamped to `minLat`..`maxLat`; south of `minLat` it keeps the 40 degree height. Its
 * mirror stands due south. `ring` is its index in cityTowers()'s ring loop.
 */
export const POLE = { ring: 6, minLat: 20, maxLat: 55, defaultLat: 40, below: 3 };
