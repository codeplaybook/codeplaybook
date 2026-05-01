---
name: 'codeplaybook-sync'
description: 'Re-deploy .codeplaybook/ standards and commands to .claude/rules/ and .claude/commands/ without re-analyzing the codebase.'
---

# codeplaybook-sync

Re-deploys agent-agnostic source files from `.codeplaybook/` to Claude Code format in `.claude/`. Use this after manually editing standards or commands — no analysis is run.

## When to Use

- After editing `.codeplaybook/standards/*.md` or `.codeplaybook/commands/*.md`
- After deleting a standard or command from `.codeplaybook/`
- To regenerate `.claude/` files if they were accidentally deleted

---

## Step 1 — Check Source Files Exist

Check that `.codeplaybook/` has at least one standard or command:

```bash
ls .codeplaybook/standards/*.md .codeplaybook/commands/*.md 2>/dev/null
```

If no files found, print:

```
No standards or commands found in .codeplaybook/.
Run /codeplaybook-onboard first to analyze your codebase and generate standards.
```

Exit the skill.

---

## Step 2 — Inventory

Count and list files:
- Standards: `.codeplaybook/standards/*.md`
- Commands: `.codeplaybook/commands/*.md`

Print:

```
codeplaybook-sync — re-deploying to .claude/

Source files:
  Standards: [N] files in .codeplaybook/standards/
  Commands:  [M] files in .codeplaybook/commands/
```

---

## Step 3 — Clean Previous Deployments

Remove previously deployed codeplaybook files to avoid stale artifacts:

```bash
# Remove codeplaybook rules (only files with codeplaybook- prefix)
rm -f .claude/rules/codeplaybook-*.md

# Remove codeplaybook commands
rm -f .claude/commands/codeplaybook-*.md
```

---

## Step 4 — Deploy Standards as Rules

For each `.codeplaybook/standards/{slug}.md`, create `.claude/rules/codeplaybook-{slug}.md`:

1. Create directory:
   ```bash
   mkdir -p .claude/rules
   ```

2. Read the standard file. Extract:
   - **description**: Use the first paragraph (under `# {Name}`) as the description
   - **globs**: Derive from the `## Scope` section. Convert scope descriptions to glob patterns:
     - "TypeScript files" -> `**/*.ts`
     - "React components" -> `**/*.tsx`
     - "All test files" -> `**/*.{test,spec}.{ts,js,tsx,jsx}`
     - "Python files in src/" -> `src/**/*.py`
     - If scope is too broad or unclear, omit globs entirely

3. Write the Claude rule file with this format:

```markdown
---
description: '{description extracted from first paragraph}'
globs: '{glob pattern derived from Scope}'
---

# {Standard Name}

{Description paragraph}

## Rules

* {Rule 1}
* {Rule 2}
```

If the standard has no meaningful scope restriction, omit the `globs` field from the frontmatter.

---

## Step 5 — Deploy Commands

For each `.codeplaybook/commands/{slug}.md`, create `.claude/commands/{slug}.md`:

1. Create directory:
   ```bash
   mkdir -p .claude/commands
   ```

2. Read the command file. Extract:
   - **description**: Use the first paragraph (under `# {Name}`) as the description

3. Write the Claude command file with this format:

```markdown
---
description: '{description extracted from first paragraph}'
---

{Rest of the command content: When to Use, Context Validation Checkpoints, Steps sections}
```

---

## Step 6 — Update CLAUDE.md

Ensure the generated rules and commands are surfaced in `CLAUDE.md`.

### Logic

1. If `CLAUDE.md` exists, read it and check if a `## Codeplaybook` section already exists
2. If the section exists, **replace it entirely** with the updated content below
3. If the section doesn't exist, **append** the content below at the end of the file
4. If `CLAUDE.md` doesn't exist at all, **create it** with just this section

### Content to write

```markdown
## Codeplaybook

### Coding Standards

Always review `.claude/rules/` before implementing any feature or fix.

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
CLAUDE.md updated.

Rules:
  - [Name] -> .claude/rules/codeplaybook-[slug].md

Commands:
  - [Name] -> .claude/commands/[slug].md

Source of truth remains in .codeplaybook/.
============================================================
```
