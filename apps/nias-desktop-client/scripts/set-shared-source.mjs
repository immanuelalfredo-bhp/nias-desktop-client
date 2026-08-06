import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const mode = process.argv[2];

const dependencyByMode = {
  local: 'file:../nias-shared',
  github: 'github:immanuelalfredo-bhp/nias-shared',
};

if (!dependencyByMode[mode]) {
  console.error('Usage: node ./scripts/set-shared-source.mjs <local|github>');
  process.exit(1);
}

const packageText = await fs.readFile(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageText);
packageJson.dependencies = packageJson.dependencies ?? {};
packageJson.dependencies['@nias/shared'] = dependencyByMode[mode];

await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(`Set @nias/shared to ${dependencyByMode[mode]}`);
