#!/usr/bin/env node
// Screenshots of the plaza from set poses, for checking the scene.
//   npm run build && npx vite preview --port 5174 &
//   node scripts/views.mjs <out-dir> name=x,z,yaw,pitch,elevation[&clock=night] ...
import { chromium } from "playwright";
const [out, ...views] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
for (const v of views) {
  const i = v.indexOf("=");
  const [name, pose] = [v.slice(0, i), v.slice(i + 1)]; // pose may carry more, e.g. 0,40,0,0.1,8&clock=night
  await page.goto(`http://127.0.0.1:5174/?pose=${pose}`);
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${out}/${name}.jpg`, type: "jpeg", quality: 80 });
  console.log(`${out}/${name}.jpg`);
}
await browser.close();
