'use strict';

const fs = require('fs');
const path = require('path');

const AGENT_VARS = {
  AGENT_RULES_DIR: '.codex/rules/',
  AGENT_CONFIG_FILE: 'AGENTS.md',
  AGENT_ANALYSES_DIR: 'references',
  AGENT_BLUEPRINTS_DIR: 'blueprints'
};

module.exports = {
  name: 'codex',
  displayName: 'OpenAI Codex',

  detect(projectPath) {
    // Codex is detected by .codex/ directory or AGENTS.md in the project root
    if (fs.existsSync(path.join(projectPath, '.codex'))) return true;
    if (fs.existsSync(path.join(projectPath, 'AGENTS.md'))) return true;
    return false;
  },

  provision(projectPath) {
    fs.mkdirSync(path.join(projectPath, '.codex'), { recursive: true });
  },

  transform(content) {
    const files = [];

    // --- Onboard skill (includes both scan and blueprint paths) ---
    files.push({
      path: '.codex/skills/codeplaybook-onboard/SKILL.md',
      content: wrapSkillMd({
        name: 'codeplaybook-onboard',
        description: 'Set up coding standards — scan your code for patterns or pick an architectural blueprint. Creates agent-agnostic standards in .codeplaybook/, then deploys rules.',
        body: resolveVars(content.workflows.onboard)
      })
    });

    // Copy analysis reference files into the onboard skill
    for (const analysis of content.analyses) {
      files.push({
        path: `.codex/skills/codeplaybook-onboard/references/${analysis.filename}`,
        content: analysis.content
      });
    }

    // Copy blueprint files into the onboard skill
    for (const blueprint of content.blueprints) {
      files.push({
        path: `.codex/skills/codeplaybook-onboard/blueprints/${blueprint.filename}`,
        content: blueprint.content
      });
    }

    // --- Sync skill ---
    files.push({
      path: '.codex/skills/codeplaybook-sync/SKILL.md',
      content: wrapSkillMd({
        name: 'codeplaybook-sync',
        description: 'Re-deploy .codeplaybook/ standards to agent rules without re-analyzing the codebase.',
        body: resolveVars(content.workflows.sync)
      })
    });

    // --- Audit skill ---
    files.push({
      path: '.codex/skills/codeplaybook-audit/SKILL.md',
      content: wrapSkillMd({
        name: 'codeplaybook-audit',
        description: 'Audit codebase against .codeplaybook/ standards. Reports violations and offers to fix them.',
        body: resolveVars(content.workflows.audit)
      })
    });

    return files;
  }
};

function wrapSkillMd({ name, description, body }) {
  return `---
name: '${name}'
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
