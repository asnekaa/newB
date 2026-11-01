import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = String(process.env.VERSION || "").replace(/^v/, "").trim();
if (!version) {
  console.error("缺少 VERSION 环境变量");
  process.exit(1);
}

const tag = `v${version}`;
const zipName = `newB-${version}.zip`;
const zipPath = path.join(ROOT, zipName);
if (!fs.existsSync(zipPath)) {
  console.error(`找不到 ${zipName}，请先运行 node package.mjs`);
  process.exit(1);
}

const changelogPath = path.join(ROOT, "CHANGELOG.md");
let notes = "";
if (fs.existsSync(changelogPath)) {
  const lines = fs.readFileSync(changelogPath, "utf8").split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start !== -1) {
    const body = [];
    for (let i = start + 1; i < lines.length; i += 1) {
      if (lines[i].startsWith("## [")) break;
      body.push(lines[i]);
    }
    notes = body.join("\n").trim();
  }
}
if (!notes) notes = `Release ${version}`;

const dryRun = process.argv.includes("--dry-run");
if (dryRun) {
  console.log(`[dry-run] ${tag}`);
  console.log(notes);
  process.exit(0);
}

const gh = (...args) => execFileSync("gh", args, { cwd: ROOT, encoding: "utf8" });

let exists = false;
try {
  gh("release", "view", tag);
  exists = true;
} catch {
  exists = false;
}

if (exists) {
  gh("release", "edit", tag, "--notes", notes);
  gh("release", "upload", tag, zipName, "--clobber");
  console.log(`✓ 已更新 Release ${tag}（正文 + 附件）`);
} else {
  gh("release", "create", tag, "--title", version, "--notes", notes, zipName);
  console.log(`✓ 已创建 Release ${tag}（含 ${zipName}）`);
}
