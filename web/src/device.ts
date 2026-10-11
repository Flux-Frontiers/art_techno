/**
 * Phones and tablets get a lighter plaza. The full models carry 36 textures at
 * 2048 px, about 800 MB of graphics memory once decoded, which is more than iOS
 * Safari lets a tab keep: it kills the page and reloads it ("a problem
 * repeatedly occurred"). On a touch screen the models come from
 * public/models/mobile instead (statues at 1024 px, craft at 512 px, about a
 * fifth of the memory), with fewer pixels and a smaller shadow map.
 * `?lite` forces it on a desktop, `?full` forces the full set.
 */
const q = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
export const LITE = q.has("full") ? false : q.has("lite") || coarse;

/** The model file to load: the light copy on a phone or tablet. */
export function modelUrl(path: string): string {
  return LITE ? path.replace(/^models\//, "models/mobile/") : path;
}
