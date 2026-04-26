// Copy Three.js's bundled Draco decoder into public/draco/ so DRACOLoader can
// fetch the .wasm + .js files from /draco/gltf/ at runtime.
// Runs on `npm install` via the "postinstall" hook; idempotent.

import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco');
const dst = join(root, 'public', 'draco');

function copyTree(s, d) {
  if (!existsSync(s)) return;
  mkdirSync(d, { recursive: true });
  for (const name of readdirSync(s)) {
    const srcPath = join(s, name);
    const dstPath = join(d, name);
    if (statSync(srcPath).isDirectory()) copyTree(srcPath, dstPath);
    else copyFileSync(srcPath, dstPath);
  }
}

if (!existsSync(src)) {
  console.warn('[copy-draco] three/examples/jsm/libs/draco not found — skipping.');
  process.exit(0);
}

copyTree(src, dst);
console.log('[copy-draco] copied Draco decoder to public/draco/');
