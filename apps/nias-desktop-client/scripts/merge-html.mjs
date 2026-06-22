import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const shellPath = path.join(rootDir, 'src', 'renderer', 'html', 'index.shell.html');
const partialsDir = path.join(rootDir, 'src', 'renderer', 'html', 'partials');
const outputPath = path.join(rootDir, 'public', 'index.html');

if (!fs.existsSync(shellPath)) {
  throw new Error(`Missing shell template: ${shellPath}`);
}

const shell = fs.readFileSync(shellPath, 'utf8');

const merged = shell.replace(/<!--\s*@include\s+([a-z0-9-]+)\s*-->/gi, (_match, includeName) => {
  const includePath = path.join(partialsDir, `${includeName}.html`);
  if (!fs.existsSync(includePath)) {
    throw new Error(`Missing include partial: ${includePath}`);
  }

  return fs.readFileSync(includePath, 'utf8').trimEnd();
});

fs.writeFileSync(outputPath, `${merged.trimEnd()}\n`, 'utf8');
console.log('Merged HTML written to public/index.html');
