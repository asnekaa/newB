import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(ROOT, "manifest.json");
const changelogPath = path.join(ROOT, "CHANGELOG.md");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const bumpArg = (args.find((a) => a.startsWith("--bump=")) || "--bump=auto").split("=")[1];

const git = (...rest) =>
  execFileSync("git", rest, { cwd: ROOT, encoding: "utf8" }).trim();

if (!fs.existsSync(manifestPath)) {
  console.error("找不到 manifest.json");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const current = manifest.version;

let lastTag = "v0.0.0";
try {
  lastTag = git("describe", "--tags", "--abbrev=0") || "v0.0.0";
} catch {
  lastTag = "v0.0.0";
}
const sinceArg = args.find((a) => a.startsWith("--since="));
if (sinceArg) lastTag = sinceArg.split("=")[1];

const RELEASE_ONLY = /^(chore\(release\)|chore:\s*\d+\.\d+\.\d+)\b/i;

let commits = [];
try {
  const raw = git("log", `${lastTag}..HEAD`, "--pretty=format:%H%x09%s%x09%b%x1e");
  commits = raw
    .split("\x1e")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [sha, subject, ...rest] = chunk.split("\t");
      return { sha, subject, body: rest.join("\t") };
    });
} catch {
  commits = [];
}

const revertedShas = new Set();
for (const commit of commits) {
  if (!/^Revert\s/i.test(commit.subject)) continue;
  for (const match of commit.body.matchAll(/This reverts commit ([0-9a-f]{7,40})/gi)) {
    revertedShas.add(match[1]);
  }
}

const effective = commits.filter((commit) => {
  if (revertedShas.has(commit.sha)) return false;
  if (commit.sha && [...revertedShas].some((sha) => sha.startsWith(commit.sha.slice(0, 7)))) return false;
  if (/^Revert\s/i.test(commit.subject)) return false;
  if (RELEASE_ONLY.test(commit.subject)) return false;
  return true;
});

const subjects = effective.map((commit) => commit.subject);

const hasBreaking = subjects.some((s) => /^[a-z]+(\(.+\))?!:/.test(s) || /BREAKING CHANGE/.test(s));
const hasFeat = subjects.some((s) => /^feat(\(.+\))?:/.test(s));
const hasFix = subjects.some((s) => /^fix(\(.+\))?:/.test(s));

const explicitBump = bumpArg !== "auto";

if (!explicitBump && !hasBreaking && !hasFeat && !hasFix) {
  console.log("没有 feat / fix 提交，不需要发版");
  process.exit(0);
}

const bump = explicitBump
  ? bumpArg
  : hasBreaking
    ? "major"
    : hasFeat
      ? "minor"
      : "patch";

const [major, minor, patch] = current.split(".").map((n) => Number(n) || 0);
const next =
  bump === "major"
    ? `${major + 1}.0.0`
    : bump === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

const groups = { feat: [], fix: [] };
for (const subject of subjects) {
  const match = subject.match(/^([a-z]+)(\(.+\))?(!)?:\s*(.+)$/);
  if (!match) continue;
  const [, type, scope, mark, text] = match;
  const line = `- ${scope ? `**${scope.slice(1, -1)}**: ` : ""}${text}${mark ? " ⚠️ BREAKING" : ""}`;
  if (type === "feat") groups.feat.push(line);
  else if (type === "fix") groups.fix.push(line);
}

const date = new Date().toISOString().slice(0, 10);
const section = [
  `## [${next}] - ${date}`,
  "",
  groups.feat.length ? `### 新增\n\n${groups.feat.join("\n")}` : "",
  groups.fix.length ? `### 修复\n\n${groups.fix.join("\n")}` : "",
]
  .filter(Boolean)
  .join("\n\n");

let changelog = "";
if (fs.existsSync(changelogPath)) {
  changelog = fs.readFileSync(changelogPath, "utf8").replace(/\r\n/g, "\n");
} else {
  changelog = "# Changelog\n\n本项目所有值得注意的变更都会记录在这里，格式参考 Keep a Changelog。\n";
}
const headerEnd = changelog.indexOf("\n\n## ");
const head = headerEnd === -1 ? changelog.trimEnd() : changelog.slice(0, headerEnd).trimEnd();
const body = headerEnd === -1 ? "" : changelog.slice(headerEnd + 1);
const nextChangelog = `${head}\n\n${section}\n${body}`.replace(/\n{3,}/g, "\n\n");

if (dryRun) {
  console.log(`当前 ${current} → 下一个 ${next}（bump=${bump}，基于 ${lastTag}）`);
  console.log("---- 变更条目 ----");
  console.log(section);
  process.exit(0);
}

manifest.version = next;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
fs.writeFileSync(changelogPath, nextChangelog, "utf8");
console.log(next);
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${next}\n`);
}
