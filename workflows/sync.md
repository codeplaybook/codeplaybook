# Codeplaybook Sync

Re-deploy `.codeplaybook/` standards and commands to the agent's rules and commands directories without re-analyzing the codebase.

## Overview

This workflow takes agent-agnostic source files from `.codeplaybook/` and deploys them into the active agent's configuration directories. It is designed to be run by any AI coding agent through an adapter layer that provides the correct paths and frontmatter format.

### Variables provided by the agent adapter

| Variable | Description | Example |
|---|---|---|
| `$AGENT_RULES_DIR` | Directory where the agent reads rule files | `.claude/rules/`, `.cursor/rules/`, etc. |
| `$AGENT_COMMANDS_DIR` | Directory where the agent reads command files | `.claude/commands/`, `.copilot/commands/`, etc. |

The agent adapter is also responsible for providing the correct **frontmatter format** used by the target agent.

## When to Use

- After editing `.codeplaybook/standards/*.md` or `.codeplaybook/commands/*.md`
- After deleting a standard or command from `.codeplaybook/`
- To regenerate deployed agent files if they were accidentally deleted

---

## Step 1 — Check Source Files Exist

Check that `.codeplaybook/` has at least one standard or command:

```bash
ls .codeplaybook/standards/*.md .codeplaybook/commands/*.md 2>/dev/null
```

If no files found, print:

```
No standards or commands found in .codeplaybook/.
Run the codeplaybook onboard workflow first to analyze your codebase and generate standards.
```

Exit the workflow.

---

## Step 2 — Inventory

Count and list files:
- Standards: `.codeplaybook/standards/*.md`
- Commands: `.codeplaybook/commands/*.md`

Print:

```
codeplaybook-sync — re-deploying to agent

Source files:
  Standards: [N] files in .codeplaybook/standards/
  Commands:  [M] files in .codeplaybook/commands/
```

---

## Step 3 — Clean Previous Deployments

Remove previously deployed codeplaybook files from `$AGENT_RULES_DIR` and `$AGENT_COMMANDS_DIR` to avoid stale artifacts. Only remove files with the `codeplaybook-` prefix to avoid disturbing other agent configuration.

---

## Step 4 — Deploy Standards as Rules

For each `.codeplaybook/standards/{slug}.md`, create `$AGENT_RULES_DIR/codeplaybook-{slug}.md`:

1. Create the rules directory if it does not exist:
   ```bash
   mkdir -p $AGENT_RULES_DIR
   ```

2. Read the standard file. Extract:
   - **description**: Use the first paragraph (under `# {Name}`) as the description
   - **globs**: Derive from the `## Scope` section. Convert scope descriptions to glob patterns:
     - "TypeScript files" -> `**/*.ts`
     - "React components" -> `**/*.tsx`
     - "All test files" -> `**/*.{test,spec}.{ts,js,tsx,jsx}`
     - "Python files in src/" -> `src/**/*.py`
     - If scope is too broad or unclear, omit globs entirely

3. Write the agent rule file using the agent's frontmatter format (provided by the agent adapter). The file content should include:
   - Frontmatter with the extracted description and globs (if applicable)
   - The standard name as a heading
   - The description paragraph
   - The rules list

If the standard has no meaningful scope restriction, omit the globs field from the frontmatter.

---

## Step 5 — Deploy Commands

For each `.codeplaybook/commands/{slug}.md`, create `$AGENT_COMMANDS_DIR/{slug}.md`:

1. Create the commands directory if it does not exist:
   ```bash
   mkdir -p $AGENT_COMMANDS_DIR
   ```

2. Read the command file. Extract:
   - **description**: Use the first paragraph (under `# {Name}`) as the description

3. Write the agent command file using the agent's frontmatter format (provided by the agent adapter). The file content should include:
   - Frontmatter with the extracted description
   - The rest of the command content (When to Use, Context Validation Checkpoints, Steps sections)

---

## Step 6 — Update Agent Configuration

Ensure the generated rules and commands are surfaced in the agent's main configuration file.

### Logic

1. If the agent configuration file exists, read it and check if a `## Codeplaybook` section already exists
2. If the section exists, **replace it entirely** with the updated content below
3. If the section doesn't exist, **append** the content below at the end of the file
4. If the agent configuration file doesn't exist at all, **create it** with just this section

### Content to write

```markdown
## Codeplaybook

### Coding Standards

Always review the rules directory before implementing any feature or fix.

{for each deployed standard, one line:}
- **{Standard Name}**: {first sentence of the standard's description}
{end for}

### Available Commands

{for each deployed command, one line:}
- `/{slug}` — {first sentence of the command's description}
{end for}
```

---

## Step 7 — Summary

Print:

```
============================================================
  SYNC COMPLETE
============================================================

Deployed: [N] standards as rules, [M] commands
Agent configuration updated.

Rules:
  - [Name] -> $AGENT_RULES_DIR/codeplaybook-[slug].md

Commands:
  - [Name] -> $AGENT_COMMANDS_DIR/[slug].md

Source of truth remains in .codeplaybook/.
============================================================
```
