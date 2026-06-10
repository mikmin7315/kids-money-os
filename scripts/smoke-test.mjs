import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const port = 3210;
const baseUrl = `http://127.0.0.1:${port}`;
const nextBin = "node_modules/next/dist/bin/next";
const checks = [
  { path: "/", cacheControl: ["private", "no-store"], redirect: "manual" },
  { path: "/login", contains: "아이의 좋은 금융 습관" },
  { path: "/legal/privacy", contains: "개인정보 처리 안내" },
  { path: "/legal/terms", contains: "이용약관" },
  { path: "/support", contains: "고객지원" },
  { path: "/account-deletion", contains: "계정 삭제 안내" },
  { path: "/manifest.webmanifest", contentType: "application/manifest", manifest: true },
];

if (!existsSync(".next/BUILD_ID")) {
  throw new Error("Production build not found. Run `npm run build` before `npm run smoke`.");
}

let output = "";
const server = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

server.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js exited before smoke tests.\n${output}`);
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for Next.js.\n${output}`);
}

try {
  await waitForServer();

  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`, { redirect: check.redirect });
    const body = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const cacheControl = response.headers.get("cache-control") ?? "";

    if (!response.ok && !(check.redirect === "manual" && response.status >= 300 && response.status < 400)) {
      throw new Error(`${check.path} returned ${response.status}`);
    }
    if (check.contains && !body.includes(check.contains)) {
      throw new Error(`${check.path} did not contain "${check.contains}"`);
    }
    if (check.contentType && !contentType.includes(check.contentType)) {
      throw new Error(`${check.path} returned unexpected content-type "${contentType}"`);
    }
    if (check.manifest) {
      const manifest = JSON.parse(body);
      if (!manifest.name?.includes("Monari") || manifest.start_url !== "/" || manifest.icons?.length < 2) {
        throw new Error(`${check.path} is missing required PWA fields`);
      }
    }
    if (check.cacheControl && !check.cacheControl.every((value) => cacheControl.includes(value))) {
      throw new Error(`${check.path} returned unsafe cache-control "${cacheControl}"`);
    }

    console.log(`smoke: ${check.path} OK`);
  }
} finally {
  server.kill("SIGTERM");
}
