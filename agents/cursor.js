'use strict';

const fs = require('fs');
const path = require('path');

const AGENT_VARS = {
  AGENT_RULES_DIR: '.cursor/rules/',
  AGENT_CONFIG_FILE: '.cursorrules',
  AGENT_ANALYSES_DIR: 'codeplaybook-references',
  AGENT_BLUEPRINTS_DIR: 'codeplaybook-blueprints'
};

module.exports = {
  name: 'cursor',
  displayName: 'Cursor',

  detect(projectPath) {
    return fs.existsSync(path.join(projectPath, '.cursor'));
  },

  provision(projectPath) {
    fs.mkdirSync(path.join(projectPath, '.cursor'), { recursive: true });
  },

  transform(content) {
    const files = [];

    // --- Onboard rule (includes both scan and blueprint paths) ---
    const onboardBody = resolveVars(content.workflows.onboard);
    files.push({
      path: '.cursor/rules/codeplaybook-onboard.md',
      content: wrapCursorRule({
        description: 'Set up coding standards — scan your code for patterns or pick an architectural blueprint.',
        body: onboardBody
      })
    });

    // Copy analysis reference files
    for (const analysis of content.analyses) {
      files.push({
        path: `.cursor/rules/codeplaybook-references/${analysis.filename}`,
        content: analysis.content
      });
    }

    // Copy blueprint files
    for (const blueprint of content.blueprints) {
      files.push({
        path: `.cursor/rules/codeplaybook-blueprints/${blueprint.filename}`,
        content: blueprint.content
      });
    }

    // --- Sync rule ---
    const syncBody = resolveVars(content.workflows.sync);
    files.push({
      path: '.cursor/rules/codeplaybook-sync.md',
      content: wrapCursorRule({
        description: 'Re-deploy .codeplaybook/ standards to .cursor/rules/ without re-analyzing.',
        body: syncBody
      })
    });

    // --- Audit rule ---
    const auditBody = resolveVars(content.workflows.audit);
    files.push({
      path: '.cursor/rules/codeplaybook-audit.md',
      content: wrapCursorRule({
        description: 'Audit codebase against .codeplaybook/ standards. Reports violations and offers to fix them.',
        body: auditBody
      })
    });

    return files;
  }
};

function wrapCursorRule({ description, body }) {
  return `---
description: '${description}'
globs: '*'
alwaysApply: false
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
