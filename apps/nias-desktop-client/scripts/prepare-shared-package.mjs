import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const desktopRoot = path.resolve(__dirname, '..');
const sharedRoot = path.resolve(desktopRoot, '../nias-shared');
const sourceDist = path.join(sharedRoot, 'dist');
const sourcePackageJson = path.join(sharedRoot, 'package.json');

const targetSharedRoot = path.join(desktopRoot, 'node_modules', '@nias', 'shared');
const targetDist = path.join(targetSharedRoot, 'dist');
const targetPackageJson = path.join(targetSharedRoot, 'package.json');

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(sourceDist))) {
  console.error(`Missing shared dist at ${sourceDist}. Run npm.cmd run build --workspace=@nias/shared first.`);
  process.exit(1);
}

await fs.mkdir(targetSharedRoot, { recursive: true });
await fs.cp(sourceDist, targetDist, { recursive: true, force: true });
await fs.copyFile(sourcePackageJson, targetPackageJson);

console.log(`Prepared @nias/shared for packaging at ${targetSharedRoot}`);
