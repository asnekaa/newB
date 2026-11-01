import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const manifestPath = path.join(ROOT, "manifest.json");

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) fail("找不到 manifest.json，请在项目根目录运行");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const version = manifest.version;
const files = new Set();

const add = (p) => {
  if (typeof p === "string" && p.trim()) files.add(p.replace(/\\/g, "/"));
};

for (const script of manifest.content_scripts ?? []) {
  (script.js ?? []).forEach(add);
  (script.css ?? []).forEach(add);
}
for (const icon of Object.values(manifest.icons ?? {})) add(icon);
if (manifest.action?.default_icon) {
  for (const icon of Object.values(manifest.action.default_icon)) add(icon);
  add(manifest.action.default_popup);
}
if (manifest.background?.service_worker) add(manifest.background.service_worker);
for (const block of manifest.web_accessible_resources ?? []) {
  for (const res of block.resources ?? []) files.add(res);
}

const walk = (dir, rel = "") => {
  for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const next = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walk(dir, next);
    else files.add(next);
  }
};

const htmlFiles = [...files].filter((f) => f.endsWith(".html"));
for (const html of htmlFiles) {
  const text = fs.readFileSync(path.join(ROOT, html), "utf8");
  const dir = path.posix.dirname(html);
  for (const match of text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    const ref = match[1];
    if (/^(https?:|data:|#|mailto:)/i.test(ref)) continue;
    const resolved = path.posix.normalize(path.posix.join(dir, ref));
    if (fs.existsSync(path.join(ROOT, resolved))) add(resolved);
  }
}

if (fs.existsSync(path.join(ROOT, "_locales"))) walk(ROOT, "_locales");
for (const extra of ["LICENSE", "README.md"]) {
  if (fs.existsSync(path.join(ROOT, extra))) add(extra);
}

const missing = [...files].filter((f) => !fs.existsSync(path.join(ROOT, f)));
if (missing.length) {
  fail(`manifest 引用了不存在的文件：\n  ${missing.join("\n  ")}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "newb-package-"));
try {
  for (const file of files) {
    const dest = path.join(tmp, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(ROOT, file), dest);
  }

  const zipName = `newB-${version}.zip`;
  const zipPath = path.join(ROOT, zipName);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  if (process.platform === "win32") {
    execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Compress-Archive -Path "${path.join(tmp, "*")}" -DestinationPath "${zipPath}" -Force`,
      ],
      { stdio: "pipe" },
    );
  } else {
    execFileSync("zip", ["-r", "-q", zipPath, ...files], { cwd: ROOT, stdio: "pipe" });
  }

  const size = (fs.statSync(zipPath).size / 1024).toFixed(1);
  console.log(`✓ 已生成 ${zipName}（${files.size} 个文件，${size} KB）`);
  console.log("  上传到 Edge 开发者后台 → 扩展 → 新版本，选择这个 zip 即可。");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
