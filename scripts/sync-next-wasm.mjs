import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
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

if (!existsSync(source)) {
  console.warn("[sync-next-wasm] Missing source wasm file:", source);
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });

if (existsSync(icloudPlaceholder)) {
  rmSync(icloudPlaceholder, { force: true });
}

copyFileSync(source, target);
console.log("[sync-next-wasm] Synced wasm_bg.wasm");
