#!/usr/bin/env node
// Minimal dependency audit for Next.js/JS repos (CommonJS, no top-level await)
// Usage: node tools/audit/scan-deps.cjs
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const ROOT = process.cwd();
const SRC_DIRS = ["frontend", "utils", "backend", "shared", "app"];
const EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const IGNORE_DIRS = new Set([
  "node_modules", ".next", "dist", "build", ".git", ".vercel",
  ".cache", ".turbo", ".idea", ".vscode", "public",
]);

const ENTRY_GLOBS = [
  "frontend/app/**/page.*",
  "frontend/app/**/layout.*",
  "frontend/app/**/template.*",
  "frontend/app/**/loading.*",
  "frontend/app/**/not-found.*",
  "frontend/middleware.*",
  "app/**/page.*",
  "app/**/layout.*",
  "app/**/template.*",
  "app/**/loading.*",
  "app/**/not-found.*",
  "middleware.*",
];

// ---------- fixed globber ----------
function globToRegex(glob) {
  // Normalize to forward slashes
  let g = glob.replace(/\\/g, "/");

  // Escape regex special chars
  g = g.replace(/([.+^${}()|[\]\\])/g, "\\$1");

  // Handle ** patterns
  g = g
    .replace(/\/\*\*\//g, "/(?:.*\\/)?") // **/ in middle
    .replace(/\*\*\//g, "(?:.*\\/)?")    // leading **/
    .replace(/\/\*\*/g, "\\/(?:.*)")     // trailing /**
    .replace(/\*\*/g, ".*");             // bare **

  // Handle single *
  g = g.replace(/\*/g, "[^/]*");

  // Handle ?
  g = g.replace(/\?/g, "[^/]");

  return new RegExp("^" + g + "$");
}

// ---------- fs crawl ----------
async function walk(dir, out = []) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

function isCodeFile(p) {
  return EXTENSIONS.includes(path.extname(p));
}

function isUnderAny(p, prefixes) {
  const rp = path.relative(ROOT, p).replace(/\\/g, "/");
  return prefixes.some((d) => rp.startsWith(d + "/") || rp === d);
}

// ---------- basic parsers ----------
const IMPORT_RE = /\bimport\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
const REQUIRE_RE = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const EXPORT_RE = /\bexport\s+(?:default|const|function|class|let|var|\{)/;

function parseImports(src) {
  const out = new Set();
  for (const re of [IMPORT_RE, REQUIRE_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) out.add(m[1]);
  }
  return [...out];
}

function hasExports(src) {
  return EXPORT_RE.test(src);
}

// ---------- resolve relative imports ----------
async function resolveImport(fromFile, spec) {
  if (!(spec.startsWith(".") || spec.startsWith("/"))) return null; // external
  const base = spec.startsWith(".")
    ? path.resolve(path.dirname(fromFile), spec)
    : path.resolve(ROOT, spec);

  const tryPaths = [];
  tryPaths.push(base); // as-is
  for (const ext of EXTENSIONS) tryPaths.push(base + ext); // with extensions
  for (const ext of EXTENSIONS) tryPaths.push(path.join(base, "index" + ext)); // index files

  for (const p of tryPaths) {
    try {
      const st = await fs.stat(p);
      if (st.isFile()) return p;
    } catch {}
  }
  return null;
}

// ---------- hash ----------
async function fileHash(p) {
  const buf = await fs.readFile(p);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

// ---------- main ----------
async function main() {
  const allFiles = (await walk(ROOT))
    .filter((p) => isUnderAny(p, SRC_DIRS) && isCodeFile(p));

  const byRel = new Map();
  for (const f of allFiles) byRel.set(path.relative(ROOT, f).replace(/\\/g, "/"), f);

  const entryRegexes = ENTRY_GLOBS.map(globToRegex);
  const entryFiles = [...byRel.keys()].filter((rel) =>
    entryRegexes.some((rx) => rx.test(rel))
  );

  const importsMap = new Map();
  const edges = new Map();
  const inward = new Map();

  for (const rel of byRel.keys()) {
    const abs = byRel.get(rel);
    let src = "";
    try { src = await fs.readFile(abs, "utf8"); } catch {}
    const specs = parseImports(src);
    importsMap.set(rel, specs);
    edges.set(rel, new Set());
    for (const s of specs) {
      if (!(s.startsWith(".") || s.startsWith("/"))) continue;
      const resolved = await resolveImport(abs, s);
      if (!resolved) continue;
      const rrel = path.relative(ROOT, resolved).replace(/\\/g, "/");
      if (!byRel.has(rrel)) continue;
      edges.get(rel).add(rrel);
      if (!inward.has(rrel)) inward.set(rrel, new Set());
      inward.get(rrel).add(rel);
    }
  }

  // reachability
  const visited = new Set();
  const queue = [...entryFiles];
  while (queue.length) {
    const cur = queue.shift();
    if (!visited.add(cur)) continue;
    for (const nb of (edges.get(cur) ?? new Set())) queue.push(nb);
  }
  const orphans = [...byRel.keys()].filter((f) => !visited.has(f));

  // files with no exports & no inbound
  const noExportNoInbound = [];
  for (const rel of byRel.keys()) {
    const abs = byRel.get(rel);
    const src = await fs.readFile(abs, "utf8");
    const exp = hasExports(src);
    const hasParents = (inward.get(rel)?.size ?? 0) > 0;
    if (!exp && !hasParents) noExportNoInbound.push(rel);
  }

  // duplicate content
  const hashGroups = new Map();
  for (const rel of byRel.keys()) {
    const abs = byRel.get(rel);
    const h = await fileHash(abs);
    if (!hashGroups.has(h)) hashGroups.set(h, []);
    hashGroups.get(h).push(rel);
  }
  const duplicates = [...hashGroups.values()].filter((arr) => arr.length > 1);

  // same-name collisions
  const nameMap = new Map();
  for (const rel of byRel.keys()) {
    const base = path.basename(rel);
    if (!nameMap.has(base)) nameMap.set(base, []);
    nameMap.get(base).push(rel);
  }
  const sameNameMulti = [...nameMap.entries()]
    .filter(([, arr]) => arr.length > 1)
    .map(([base, arr]) => ({ base, files: arr }));

  // unresolved relative imports
  const unresolved = [];
  for (const [rel, specs] of importsMap.entries()) {
    const abs = byRel.get(rel);
    for (const s of specs) {
      if (!(s.startsWith(".") || s.startsWith("/"))) continue;
      const resolved = await resolveImport(abs, s);
      if (!resolved) unresolved.push({ from: rel, spec: s });
    }
  }

  // write report
  const lines = [];
  lines.push("# Repository Audit Report", "");
  lines.push(`Scanned roots: ${SRC_DIRS.join(", ")}`);
  lines.push("Entry patterns:");
  for (const g of ENTRY_GLOBS) lines.push("- " + g);
  lines.push("");

  lines.push("## 1) Orphan Files (not reachable from entries)");
  if (orphans.length === 0) lines.push("- None ✅");
  else lines.push(...orphans.map((f) => `- ${f}`));

  lines.push("");
  lines.push("## 2) Files with NO exports and NO inbound imports");
  if (noExportNoInbound.length === 0) lines.push("- None ✅");
  else lines.push(...noExportNoInbound.map((f) => `- ${f}`));

  lines.push("");
  lines.push("## 3) Duplicate Content (same hash)");
  if (duplicates.length === 0) lines.push("- None ✅");
  else {
    duplicates.forEach((group, i) => {
      lines.push(`- Group ${i + 1}:`);
      group.forEach((f) => lines.push(`  - ${f}`));
    });
  }

  lines.push("");
  lines.push("## 4) Same-name Collisions (basename appears in multiple locations)");
  if (sameNameMulti.length === 0) lines.push("- None ✅");
  else {
    for (const { base, files } of sameNameMulti) {
      lines.push(`- **${base}**`);
      files.forEach((f) => lines.push(`  - ${f}`));
    }
  }

  lines.push("");
  lines.push("## 5) Unresolved Relative Imports");
  if (unresolved.length === 0) lines.push("- None ✅");
  else unresolved.forEach(({ from, spec }) => lines.push(`- ${from} → ${spec}`));

  const outPath = path.join(ROOT, "audit-report.md");
  await fs.writeFile(outPath, lines.join("\n"), "utf8");
  console.log("\n✅ Wrote audit-report.md with findings.\n");
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
