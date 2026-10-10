#!/usr/bin/env node
// Screenshots of the plaza from set poses, for checking the scene.
//   npm run build && npx vite preview --port 5174 &
//   node scripts/views.mjs <out-dir> name=x,z,yaw,pitch,elevation ...
import { chromium } from "playwright";
const [out, ...views] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
for (const v of views) {
  const [name, pose] = v.split("=");
  await page.goto(`http://127.0.0.1:5174/?pose=${pose}`);
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${out}/${name}.jpg`, type: "jpeg", quality: 80 });
  console.log(`${out}/${name}.jpg`);
}
await browser.close();
