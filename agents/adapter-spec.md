# Agent Adapter Specification

This document defines the interface for agent adapters. An adapter teaches codeplaybook how to install skills for a specific coding agent.

## Interface

Each adapter is a CommonJS module (`agents/{name}.js`) that exports:

```javascript
module.exports = {
  name: 'agent-name',           // Lowercase identifier
  displayName: 'Agent Name',    // Human-readable name

  detect(projectPath) { ... },  // Returns boolean
  transform(content) { ... }    // Returns array of { path, content }
};
```

## `detect(projectPath)`

Returns `true` if this agent is present in the project at `projectPath`.

Typically checks for the agent's config directory:

```javascript
detect(projectPath) {
  return fs.existsSync(path.join(projectPath, '.agent-dir'));
}
```

## `transform(content)`

Takes assembled content and returns an array of file descriptors to write.

### Input: `content`

```javascript
{
  blueprints: [
    { name: 'hexagonal', filename: 'hexagonal.md', content: '...' },
    // ...
  ],
  analyses: [
    { name: 'code-scaffolding', filename: 'code-scaffolding.md', content: '...' },
    // ...
  ],
  workflows: {
    onboard: '...',   // Full markdown content of onboard workflow
    prescribe: '...', // Full markdown content of prescribe workflow
    sync: '...'       // Full markdown content of sync workflow
  }
}
```

### Output

Array of `{ path, content }` objects:

```javascript
[
  { path: '.agent/skills/codeplaybook-onboard.md', content: '...' },
  { path: '.agent/skills/codeplaybook-prescribe.md', content: '...' },
  // ...
]
```

Paths are relative to the project root.

### Variable Resolution

Workflow content contains placeholder variables that must be resolved to agent-specific values:

| Variable | Description | Example (Claude Code) |
|----------|-------------|-----------------------|
| `$AGENT_RULES_DIR` | Where the agent reads rule files | `.claude/rules/` |
| `$AGENT_COMMANDS_DIR` | Where the agent reads command files | `.claude/commands/` |
| `$AGENT_CONFIG_FILE` | Agent's top-level config file | `CLAUDE.md` |

Use string replacement:

```javascript
function resolveVars(text) {
  return text
    .replace(/\$AGENT_RULES_DIR/g, '.your-agent/rules/')
    .replace(/\$AGENT_COMMANDS_DIR/g, '.your-agent/commands/')
    .replace(/\$AGENT_CONFIG_FILE/g, '.your-agent/config.md');
}
```

### Wrapping Workflows

Each agent has its own format for instruction files. The adapter wraps workflow content in the agent's format:

- **Claude Code**: SKILL.md with `---name/description---` frontmatter
- **Cursor**: Rule files with `---globs/alwaysApply---` frontmatter
- **Copilot**: Instruction files with `---applyTo---` frontmatter

### Bundling References

Analysis and blueprint files should be copied alongside the workflow files so the agent can reference them:

```javascript
// Copy analyses as references for the onboard workflow
for (const analysis of content.analyses) {
  files.push({
    path: `.agent/skills/codeplaybook-references/${analysis.filename}`,
    content: analysis.content
  });
}
```

## Example: Minimal Adapter

```javascript
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'myagent',
  displayName: 'My Agent',

  detect(projectPath) {
    return fs.existsSync(path.join(projectPath, '.myagent'));
  },

  transform(content) {
    const files = [];

    // Install each workflow
    for (const [name, body] of Object.entries(content.workflows)) {
      files.push({
        path: `.myagent/instructions/codeplaybook-${name}.md`,
        content: resolveVars(body)
      });
    }

    // Bundle blueprints
    for (const bp of content.blueprints) {
      files.push({
        path: `.myagent/instructions/codeplaybook-blueprints/${bp.filename}`,
        content: bp.content
      });
    }

    // Bundle analyses
    for (const a of content.analyses) {
      files.push({
        path: `.myagent/instructions/codeplaybook-references/${a.filename}`,
        content: a.content
      });
    }

    return files;
  }
};

function resolveVars(text) {
  return text
    .replace(/\$AGENT_RULES_DIR/g, '.myagent/rules/')
    .replace(/\$AGENT_COMMANDS_DIR/g, '.myagent/commands/')
    .replace(/\$AGENT_CONFIG_FILE/g, '.myagent/config.md');
}
```

## Testing

Test your adapter by running:

```bash
mkdir -p /tmp/test/.myagent
cd /tmp/test
node /path/to/codeplaybook/bin/cli.js init
```

Verify:
1. Your agent is detected in the output
2. All expected files are created
3. Workflow variables are resolved correctly
4. Blueprint and analysis reference files are bundled
