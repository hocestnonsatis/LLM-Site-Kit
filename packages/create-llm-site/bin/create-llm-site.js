#!/usr/bin/env node

/**
 * Scaffold a new LLM-Site-Kit project.
 * Usage: npm create llm-site@latest [dir]
 */

import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';
import prompts from 'prompts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templateDir = join(__dirname, '..', 'template');

const argv = minimist(process.argv.slice(2), { string: ['_'], alias: { h: 'help' } });

async function main() {
  let targetDir = argv._[0];
  if (!targetDir) {
    const { name } = await prompts({
      type: 'text',
      name: 'name',
      message: 'Project name (directory):',
      initial: 'my-agent-docs',
    });
    if (!name) process.exit(1);
    targetDir = name;
  }

  const dest = join(process.cwd(), targetDir);
  if (existsSync(dest)) {
    console.error(`Error: "${targetDir}" already exists.`);
    process.exit(1);
  }

  mkdirSync(dest, { recursive: true });
  copyRecursive(templateDir, dest);

  // Replace placeholder in package.json if present
  const pkgPath = join(dest, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    pkg.name = targetDir.replace(/\s+/g, '-').toLowerCase();
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  console.log('\nDone. Next steps:\n');
  console.log(`  cd ${targetDir}`);
  console.log('  npm install');
  console.log('  npm run dev');
  console.log('\nTest agent response:');
  console.log(`  curl -A "GPTBot/1.0" http://localhost:5173/docs/core\n`);
}

function copyRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const srcPath = join(src, name);
    const destPath = join(dest, name);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
