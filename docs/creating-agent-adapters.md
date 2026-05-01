# Creating Agent Adapters

An agent adapter teaches codeplaybook how to install skills for a specific coding agent (e.g., Continue.dev, Windsurf, Codex).

## Quick start

1. Read `agents/adapter-spec.md` for the full interface specification
2. Create `agents/{name}.js`
3. Implement `detect()` and `transform()`
4. Test with `node bin/cli.js init`
5. Submit a PR

## What an adapter does

1. **Detects** whether the agent is present in a project (checks for config directories)
2. **Transforms** codeplaybook content into the agent's native format (wraps workflows, resolves variables, bundles references)

## Key concepts

### Variable resolution

Workflow files contain placeholder variables:
- `$AGENT_RULES_DIR` → where your agent reads rule files
- `$AGENT_COMMANDS_DIR` → where your agent reads command files
- `$AGENT_CONFIG_FILE` → your agent's top-level config file

Your adapter replaces these with concrete paths.

### Content wrapping

Each agent has its own file format. Your adapter wraps the workflow markdown in that format. For example:
- Claude Code uses SKILL.md with `---name/description---` frontmatter
- Cursor uses rule files with `---globs/alwaysApply---` frontmatter
- Copilot uses instruction files with `---applyTo---` frontmatter

### Reference bundling

Analysis and blueprint files need to be copied alongside workflow files so the agent can read them during execution.

## Testing

```bash
# Create a test project with your agent's directory
mkdir -p /tmp/test/.youragent
cd /tmp/test

# Run init
node /path/to/codeplaybook/bin/cli.js init

# Verify
# 1. Your agent shows up in "Detected agents"
# 2. Files are created in the right locations
# 3. Variables are resolved (search for $AGENT_ -- none should remain)
# 4. Blueprint and analysis references are present
```

## Reference

See `agents/adapter-spec.md` for the complete interface specification with code examples.

See `agents/claude.js`, `agents/cursor.js`, and `agents/copilot.js` for working implementations.
