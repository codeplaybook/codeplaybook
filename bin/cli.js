#!/usr/bin/env node

'use strict';

const fs = require('fs');
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

  switch (command) {
    case 'init':
      await runInit();
      break;
    case 'audit-save':
      await runAuditSave(args.slice(1));
      break;
    case 'dashboard':
      await runDashboard(args.slice(1));
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "codeplaybook help" for usage.');
      process.exit(1);
  }
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

  let selected = detected;

  if (detected.length === 0) {
    const choices = await promptAgentSelection(adapters);

    if (choices.length === 0) {
      console.log('  No agents selected. Exiting.');
      process.exit(0);
    }

    // Create directories for selected agents
    for (const adapter of choices) {
      try {
        adapter.provision(projectPath);
      } catch (err) {
        console.error(`  Failed to set up ${adapter.displayName}: ${err.message}`);
        process.exit(1);
      }
    }

    selected = choices;
  }

  console.log('  Agents:');
  selected.forEach(a => {
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
    return fs.existsSync(path.join(projectPath, p));
  });
  if (hasExisting) {
    console.log('  Note: Existing codeplaybook installation detected. Files will be updated.');
    console.log();
  }

  // Step 3: Install for each agent
  let totalFiles = 0;

  for (const adapter of selected) {
    console.log(`  Installing for ${adapter.displayName}...`);
    const files = adapter.transform(content);
    const count = installForAgent(projectPath, files);
    totalFiles += count;
    console.log(`    → ${count} files written`);
  }

  console.log();
  console.log('  ─────────────────');
  console.log(`  Done! ${totalFiles} files installed for ${selected.length} agent(s).`);
  console.log();
  console.log('  Next steps:');
  console.log('    1. Open your coding agent (Claude Code, Cursor, etc.)');
  console.log('    2. Run /codeplaybook-onboard to discover patterns in your code');
  console.log('    3. Or choose "Start with a blueprint" during onboard to declare architecture upfront');
  console.log();
}

async function runAuditSave(args) {
  // Parse --file flag
  const fileIdx = args.indexOf('--file');
  if (fileIdx === -1 || !args[fileIdx + 1]) {
    console.error('Usage: codeplaybook audit-save --file <path-to-json>');
    process.exit(1);
  }

  const jsonPath = args[fileIdx + 1];

  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  // Read and parse JSON
  let data;
  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse JSON: ${err.message}`);
    process.exit(1);
  }

  if (!data.violations || !Array.isArray(data.violations)) {
    console.error('Invalid format: JSON must have a "violations" array.');
    process.exit(1);
  }

  // Validate required fields (context is NOT required from the agent — we generate it)
  const required = ['file', 'line', 'standard_name', 'standard_slug', 'severity', 'rule', 'evidence'];
  const errors = [];
  data.violations.forEach((v, i) => {
    const missing = required.filter(f => !v[f] && v[f] !== 0);
    if (missing.length > 0) {
      errors.push(`  Violation ${i + 1} (${v.file || 'unknown'}): missing ${missing.join(', ')}`);
    }
  });

  if (errors.length > 0) {
    console.error('Validation failed — violations have missing required fields:\n');
    errors.forEach(e => console.error(e));
    console.error('\nEvery violation must include: file, line, standard_name, standard_slug, severity, rule, evidence.');
    console.error('Please re-run /codeplaybook-audit to generate complete violation data.');
    process.exit(1);
  }

  // Auto-generate code context for each violation (read ±4 lines from actual file)
  const CONTEXT_LINES = 4;
  for (const v of data.violations) {
    if (v.context) continue; // agent already provided it, keep it

    const filePath = path.resolve(process.cwd(), v.file);
    const projectRoot = path.resolve(process.cwd());
    if (!filePath.startsWith(projectRoot + path.sep)) continue;
    if (v.line && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const allLines = fileContent.split('\n');
        const startLine = Math.max(1, v.line - CONTEXT_LINES);
        const endLine = Math.min(allLines.length, (v.end_line || v.line) + CONTEXT_LINES);
        const lines = allLines.slice(startLine - 1, endLine);

        const highlightLines = [];
        for (let l = v.line; l <= (v.end_line || v.line); l++) {
          highlightLines.push(l);
        }

        v.context = {
          start_line: startLine,
          lines: lines,
          highlight_lines: highlightLines
        };
      } catch (_) {
        // File unreadable — skip context
      }
    }
  }

  // Detect project name
  const projectPath = process.cwd();
  let projectName;
  try {
    const { execSync } = require('child_process');
    projectName = execSync('git rev-parse --show-toplevel', { cwd: projectPath, encoding: 'utf-8' }).trim();
    projectName = path.basename(projectName);
  } catch (_) {
    projectName = path.basename(projectPath);
  }

  // Initialize DB at user-level and save
  const { getDbPath, initDb, saveAuditRun } = require('../src/db');
  const dbPath = getDbPath();
  const db = initDb(dbPath);
  const result = saveAuditRun(db, data, projectName, projectPath);
  db.close();

  // Clean up the temp JSON file
  try {
    fs.unlinkSync(jsonPath);
  } catch (_) {
    // Ignore cleanup errors
  }

  console.log(`  Saved ${data.violations.length} violations for "${projectName}" to ~/.codeplaybook/audit.db`);
  console.log(`  Run ID: ${result.runId} | Date: ${result.runDate}`);
}

async function runDashboard(args) {
  // Parse --port flag
  const portIdx = args.indexOf('--port');
  const port = (portIdx !== -1 && args[portIdx + 1]) ? parseInt(args[portIdx + 1], 10) : 4200;

  if (isNaN(port) || port < 1 || port > 65535) {
    console.error('  Invalid port. Must be a number between 1 and 65535.');
    process.exit(1);
  }

  const { getDbPath } = require('../src/db');
  const dbPath = getDbPath();

  if (!fs.existsSync(dbPath)) {
    console.error('  No audit database found at ~/.codeplaybook/audit.db');
    console.error('  Run /codeplaybook-audit first to generate audit data.');
    process.exit(1);
  }

  const { startDashboard } = require('../src/dashboard');
  startDashboard(dbPath, port);
}

async function promptAgentSelection(adapters) {
  const { MultiSelect } = require('enquirer');

  console.log('  No coding agents detected.');
  console.log();

  try {
    const prompt = new MultiSelect({
      name: 'agents',
      message: 'Select agents to set up (space to toggle, enter to confirm)',
      choices: adapters.map(a => ({ name: a.displayName, value: a.name }))
    });

    const selectedNames = await prompt.run();
    return adapters.filter(a => selectedNames.includes(a.displayName));
  } catch (_) {
    // User pressed Ctrl+C
    console.log();
    process.exit(0);
  }
}

function loadAdapters() {
  const adapterFiles = fs.readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('.js') && !f.startsWith('_'));

  return adapterFiles.map(f => require(path.join(AGENTS_DIR, f)));
}

function printHelp() {
  console.log(`
  codeplaybook — Agent-agnostic coding standards for any codebase

  Usage:
    npx codeplaybook init                       Set up codeplaybook in the current project
    npx codeplaybook audit-save --file <path>   Save audit results to local database
    npx codeplaybook dashboard [--port 4200]    Open audit dashboard in browser
    npx codeplaybook help                       Show this help message
    npx codeplaybook --version                  Show version

  Workflows (run inside your coding agent):
    /codeplaybook-onboard     Scan code or pick a blueprint → generate standards
    /codeplaybook-audit       Audit code against standards → report + fix
    /codeplaybook-sync        Re-deploy after editing standards

  Learn more: https://github.com/codeplaybook/codeplaybook
`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
