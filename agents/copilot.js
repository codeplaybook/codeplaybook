'use strict';

const fs = require('fs');
const path = require('path');

const AGENT_VARS = {
  AGENT_RULES_DIR: '.github/instructions/',
  AGENT_COMMANDS_DIR: '.github/prompts/',
  AGENT_CONFIG_FILE: '.github/copilot-instructions.md',
  AGENT_ANALYSES_DIR: 'codeplaybook-references',
  AGENT_BLUEPRINTS_DIR: 'codeplaybook-blueprints'
};

module.exports = {
  name: 'copilot',
  displayName: 'GitHub Copilot',

  detect(projectPath) {
    // Copilot is detected by .github/ directory with copilot-specific files
    // or by the presence of .github/copilot-instructions.md
    const githubDir = path.join(projectPath, '.github');
    if (!fs.existsSync(githubDir)) return false;

    // Check for explicit Copilot config
    const copilotInstructions = path.join(githubDir, 'copilot-instructions.md');
    if (fs.existsSync(copilotInstructions)) return true;

    // Check for .github/instructions/ directory (Copilot custom instructions)
    const instructionsDir = path.join(githubDir, 'instructions');
    if (fs.existsSync(instructionsDir)) return true;

    // Check for .github/prompts/ directory (Copilot custom prompts)
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

    // Copilot uses .github/instructions/ for instructions (with applyTo: frontmatter)
    // and .github/prompts/ for reusable prompts

    // --- Onboard instruction ---
    const onboardBody = resolveVars(content.workflows.onboard);
    files.push({
      path: '.github/instructions/codeplaybook-onboard.md',
      content: wrapInstruction({
        description: 'Analyze codebase and generate coding standards & commands locally.',
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

    // --- Prescribe instruction ---
    const prescribeBody = resolveVars(content.workflows.prescribe);
    files.push({
      path: '.github/instructions/codeplaybook-prescribe.md',
      content: wrapInstruction({
        description: 'Declare architectural intent and generate prescribed standards & commands from blueprints.',
        body: prescribeBody
      })
    });

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
        description: 'Re-deploy .codeplaybook/ standards and commands without re-analyzing.',
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
      content: 'Run the codeplaybook onboard workflow: analyze this codebase for recurring patterns and generate coding standards and commands in .codeplaybook/. Follow the instructions in .github/instructions/codeplaybook-onboard.md.'
    });

    files.push({
      path: '.github/prompts/codeplaybook-prescribe.prompt.md',
      content: 'Run the codeplaybook prescribe workflow: help me declare architectural intent and generate standards from blueprints. Follow the instructions in .github/instructions/codeplaybook-prescribe.md.'
    });

    files.push({
      path: '.github/prompts/codeplaybook-sync.prompt.md',
      content: 'Run the codeplaybook sync workflow: re-deploy standards and commands from .codeplaybook/ to the agent directories. Follow the instructions in .github/instructions/codeplaybook-sync.md.'
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
    .replace(/\$AGENT_COMMANDS_DIR/g, AGENT_VARS.AGENT_COMMANDS_DIR)
    .replace(/\$AGENT_CONFIG_FILE/g, AGENT_VARS.AGENT_CONFIG_FILE)
    .replace(/\$AGENT_ANALYSES_DIR/g, AGENT_VARS.AGENT_ANALYSES_DIR)
    .replace(/\$AGENT_BLUEPRINTS_DIR/g, AGENT_VARS.AGENT_BLUEPRINTS_DIR);
}
