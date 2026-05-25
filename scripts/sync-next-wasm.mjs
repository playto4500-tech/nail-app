import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve(
  process.cwd(),
  "node_modules/@next/swc-wasm-nodejs/wasm_bg.wasm",
);
const target = resolve(
  process.cwd(),
  "node_modules/next/wasm/@next/swc-wasm-nodejs/wasm_bg.wasm",
);
const icloudPlaceholder = `${target}.icloud`;
const nextBuildDir = resolve(process.cwd(), ".next");

function cleanupNextDevArtifacts(directory) {
  if (!existsSync(directory)) {
    return;
  }

  for (const entry of readdirSync(directory)) {
    const entryPath = resolve(directory, entry);
    const entryStats = statSync(entryPath);

    if (entryStats.isDirectory()) {
      cleanupNextDevArtifacts(entryPath);
      continue;
    }

    if (entry.endsWith(".icloud") || entry.includes(" 2.")) {
      rmSync(entryPath, { force: true });
    }
  }
}

if (!existsSync(source)) {
  console.warn("[sync-next-wasm] Missing source wasm file:", source);
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });

if (existsSync(icloudPlaceholder)) {
  rmSync(icloudPlaceholder, { force: true });
}

cleanupNextDevArtifacts(nextBuildDir);

copyFileSync(source, target);
console.log("[sync-next-wasm] Synced wasm_bg.wasm");
