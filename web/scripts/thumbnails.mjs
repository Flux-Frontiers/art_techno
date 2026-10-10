#!/usr/bin/env node
// Make the plaque thumbnails (public/renders/<id>.jpg) from the plaza itself, so
// each shows the statue as it now stands: its current model on the series plinth.
//
// Needs Playwright with a Chromium: npm i -D playwright && npx playwright install chromium
// Run against a preview of the built site:
//   npm run build && npx vite preview --port 5174 &
//   node scripts/thumbnails.mjs [http://127.0.0.1:5174/] [spirit-id ...]
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const url = args[0]?.startsWith("http") ? args.shift() : "http://127.0.0.1:5174/";
const src = readFileSync(new URL("../src/spirits.ts", import.meta.url), "utf8");
// Every Spirit with a model, unless ids were given.
const withModels = [...src.matchAll(/id: "([a-z]+)"[\s\S]*?(?=\n  \{|\n\];)/g)]
  .filter((m) => m[0].includes("model:"))
  .map((m) => m[1]);
const ids = args.length ? args : withModels;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
for (const id of ids) {
  await page.goto(`${url}?thumb=${id}`);
  // Let the models load and the floodlights settle.
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `public/renders/${id}.jpg`, type: "jpeg", quality: 84 });
  console.log(`public/renders/${id}.jpg`);
}
await browser.close();
