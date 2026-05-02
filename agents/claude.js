'use strict';

const fs = require('fs');
const path = require('path');

const AGENT_VARS = {
  AGENT_RULES_DIR: '.claude/rules/',
  AGENT_COMMANDS_DIR: '.claude/commands/',
  AGENT_CONFIG_FILE: 'CLAUDE.md',
  AGENT_ANALYSES_DIR: 'references',
  AGENT_BLUEPRINTS_DIR: 'blueprints'
};

module.exports = {
  name: 'claude',
  displayName: 'Claude Code',

  detect(projectPath) {
    return fs.existsSync(path.join(projectPath, '.claude'));
  },

  transform(content) {
    const files = [];

    // --- Onboard skill ---
    files.push({
      path: '.claude/skills/codeplaybook-onboard/SKILL.md',
      content: wrapSkillMd({
        name: 'codeplaybook-onboard',
        description: 'Analyze codebase and generate coding standards & commands locally. Creates agent-agnostic standards in .codeplaybook/, then deploys as .claude/rules/ and .claude/commands/.',
        body: resolveVars(content.workflows.onboard)
      })
    });

    // Copy analysis reference files into the skill
    for (const analysis of content.analyses) {
      files.push({
        path: `.claude/skills/codeplaybook-onboard/references/${analysis.filename}`,
        content: analysis.content
      });
    }

    // --- Prescribe skill ---
    files.push({
      path: '.claude/skills/codeplaybook-prescribe/SKILL.md',
      content: wrapSkillMd({
        name: 'codeplaybook-prescribe',
        description: 'Declare architectural intent and generate prescribed standards & commands from blueprints. Use before codeplaybook-onboard for greenfield projects.',
        body: resolveVars(content.workflows.prescribe)
      })
    });

    // Copy blueprint files into the skill
    for (const blueprint of content.blueprints) {
      files.push({
        path: `.claude/skills/codeplaybook-prescribe/blueprints/${blueprint.filename}`,
        content: blueprint.content
      });
    }

    // --- Sync skill ---
    files.push({
      path: '.claude/skills/codeplaybook-sync/SKILL.md',
      content: wrapSkillMd({
        name: 'codeplaybook-sync',
        description: 'Re-deploy .codeplaybook/ standards and commands to .claude/rules/ and .claude/commands/ without re-analyzing the codebase.',
        body: resolveVars(content.workflows.sync)
      })
    });

    // --- Audit skill ---
    files.push({
      path: '.claude/skills/codeplaybook-audit/SKILL.md',
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
    .replace(/\$AGENT_COMMANDS_DIR/g, AGENT_VARS.AGENT_COMMANDS_DIR)
    .replace(/\$AGENT_CONFIG_FILE/g, AGENT_VARS.AGENT_CONFIG_FILE)
    .replace(/\$AGENT_ANALYSES_DIR/g, AGENT_VARS.AGENT_ANALYSES_DIR)
    .replace(/\$AGENT_BLUEPRINTS_DIR/g, AGENT_VARS.AGENT_BLUEPRINTS_DIR);
}
