'use strict';

const fs = require('fs');
const path = require('path');

const AGENT_VARS = {
  AGENT_RULES_DIR: '.github/instructions/',
  AGENT_CONFIG_FILE: '.github/copilot-instructions.md',
  AGENT_ANALYSES_DIR: 'codeplaybook-references',
  AGENT_BLUEPRINTS_DIR: 'codeplaybook-blueprints'
};

module.exports = {
  name: 'copilot',
  displayName: 'GitHub Copilot',

  detect(projectPath) {
    const githubDir = path.join(projectPath, '.github');
    if (!fs.existsSync(githubDir)) return false;

    const copilotInstructions = path.join(githubDir, 'copilot-instructions.md');
    if (fs.existsSync(copilotInstructions)) return true;

    const instructionsDir = path.join(githubDir, 'instructions');
    if (fs.existsSync(instructionsDir)) return true;

    const promptsDir = path.join(githubDir, 'prompts');
    if (fs.existsSync(promptsDir)) return true;

    return false;
  },

  provision(projectPath) {
    const instructionsDir = path.join(projectPath, '.github', 'instructions');
    fs.mkdirSync(instructionsDir, { recursive: true });
  },

  transform(content) {
    const files = [];

    // --- Onboard instruction (includes both scan and blueprint paths) ---
    const onboardBody = resolveVars(content.workflows.onboard);
    files.push({
      path: '.github/instructions/codeplaybook-onboard.md',
      content: wrapInstruction({
        description: 'Set up coding standards — scan your code for patterns or pick an architectural blueprint.',
        body: onboardBody
      })
    });

    // Copy analysis reference files
    for (const analysis of content.analyses) {
      files.push({
        path: `.github/instructions/codeplaybook-references/${analysis.filename}`,
        content: analysis.content
      });
    }

    // Copy blueprint files
    for (const blueprint of content.blueprints) {
      files.push({
        path: `.github/instructions/codeplaybook-blueprints/${blueprint.filename}`,
        content: blueprint.content
      });
    }

    // --- Sync instruction ---
    const syncBody = resolveVars(content.workflows.sync);
    files.push({
      path: '.github/instructions/codeplaybook-sync.md',
      content: wrapInstruction({
        description: 'Re-deploy .codeplaybook/ standards without re-analyzing.',
        body: syncBody
      })
    });

    // --- Audit instruction ---
    const auditBody = resolveVars(content.workflows.audit);
    files.push({
      path: '.github/instructions/codeplaybook-audit.md',
      content: wrapInstruction({
        description: 'Audit codebase against .codeplaybook/ standards. Reports violations and offers to fix them.',
        body: auditBody
      })
    });

    // --- Prompts (invocable shortcuts) ---
    files.push({
      path: '.github/prompts/codeplaybook-onboard.prompt.md',
      content: 'Run the codeplaybook onboard workflow: set up coding standards for this project — either by scanning existing code for patterns or by picking an architectural blueprint. Follow the instructions in .github/instructions/codeplaybook-onboard.md.'
    });

    files.push({
      path: '.github/prompts/codeplaybook-sync.prompt.md',
      content: 'Run the codeplaybook sync workflow: re-deploy standards from .codeplaybook/ to the agent directories. Follow the instructions in .github/instructions/codeplaybook-sync.md.'
    });

    files.push({
      path: '.github/prompts/codeplaybook-audit.prompt.md',
      content: 'Run the codeplaybook audit workflow: scan this codebase against the standards in .codeplaybook/standards/, report violations, and offer to fix them. Follow the instructions in .github/instructions/codeplaybook-audit.md.'
    });

    return files;
  }
};

function wrapInstruction({ description, body }) {
  return `---
applyTo: '**'
description: '${description}'
---

${body}`;
}

function resolveVars(text) {
  return text
    .replace(/\$AGENT_RULES_DIR/g, AGENT_VARS.AGENT_RULES_DIR)
    .replace(/\$AGENT_CONFIG_FILE/g, AGENT_VARS.AGENT_CONFIG_FILE)
    .replace(/\$AGENT_ANALYSES_DIR/g, AGENT_VARS.AGENT_ANALYSES_DIR)
    .replace(/\$AGENT_BLUEPRINTS_DIR/g, AGENT_VARS.AGENT_BLUEPRINTS_DIR);
}
