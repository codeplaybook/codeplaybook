#!/usr/bin/env node

'use strict';

const path = require('path');
const { detectAgents } = require('../src/detect');
const { assembleContent } = require('../src/assemble');
const { installForAgent } = require('../src/install');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    const pkg = require('../package.json');
    console.log(pkg.version);
    process.exit(0);
  }

  if (command !== 'init') {
    console.error(`Unknown command: ${command}`);
    console.error('Run "codeplaybook help" for usage.');
    process.exit(1);
  }

  await runInit();
}

async function runInit() {
  const projectPath = process.cwd();
  const packageRoot = path.join(__dirname, '..');

  console.log();
  console.log('  codeplaybook init');
  console.log('  ─────────────────');
  console.log();

  // Step 1: Detect agents
  const adapters = loadAdapters();
  const detected = detectAgents(projectPath, adapters);

  if (detected.length === 0) {
    console.log('  No coding agents detected in this project.');
    console.log();
    console.log('  Supported agents:');
    adapters.forEach(a => {
      console.log(`    - ${a.displayName}`);
    });
    console.log();
    console.log('  Create the agent directory first (e.g., mkdir .claude) and re-run.');
    process.exit(1);
  }

  console.log('  Detected agents:');
  detected.forEach(a => {
    console.log(`    ✓ ${a.displayName}`);
  });
  console.log();

  // Step 2: Assemble content
  const content = assembleContent(packageRoot);
  console.log(`  Content loaded:`);
  console.log(`    ${content.blueprints.length} blueprints`);
  console.log(`    ${content.analyses.length} analyses`);
  console.log(`    ${Object.keys(content.workflows).length} workflows`);
  console.log();

  // Check for existing codeplaybook installations
  const existingPaths = [
    '.claude/skills/codeplaybook-onboard',
    '.cursor/rules/codeplaybook-onboard.md',
    '.github/instructions/codeplaybook-onboard.md'
  ];
  const hasExisting = existingPaths.some(p => {
    const fs = require('fs');
    return fs.existsSync(path.join(projectPath, p));
  });
  if (hasExisting) {
    console.log('  Note: Existing codeplaybook installation detected. Files will be updated.');
    console.log();
  }

  // Step 3: Install for each agent
  let totalFiles = 0;

  for (const adapter of detected) {
    console.log(`  Installing for ${adapter.displayName}...`);
    const files = adapter.transform(content);
    const count = installForAgent(projectPath, files);
    totalFiles += count;
    console.log(`    → ${count} files written`);
  }

  console.log();
  console.log('  ─────────────────');
  console.log(`  Done! ${totalFiles} files installed for ${detected.length} agent(s).`);
  console.log();
  console.log('  Next steps:');
  console.log('    1. Open your coding agent (Claude Code, Cursor, etc.)');
  console.log('    2. Run /codeplaybook-onboard to discover patterns in your code');
  console.log('    3. Or run /codeplaybook-prescribe to declare architecture upfront');
  console.log();
}

function loadAdapters() {
  const fs = require('fs');
  const adapterFiles = fs.readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('.js') && !f.startsWith('_'));

  return adapterFiles.map(f => require(path.join(AGENTS_DIR, f)));
}

function printHelp() {
  console.log(`
  codeplaybook — Agent-agnostic coding standards for any codebase

  Usage:
    npx codeplaybook init       Set up codeplaybook in the current project
    npx codeplaybook help       Show this help message
    npx codeplaybook --version  Show version

  What it does:
    1. Detects which coding agents you use (Claude Code, Cursor, Copilot)
    2. Installs codeplaybook skills/rules for each detected agent
    3. You then use your agent to run /codeplaybook-onboard or /codeplaybook-prescribe

  Learn more: https://github.com/codeplaybook/codeplaybook
`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
