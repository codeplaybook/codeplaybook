# Onboard Workflow

Analyze a codebase for recurring patterns and generate coding standards and commands locally.

## Overview

This workflow provides **local automated onboarding** for any codebase:
1. Analyzes the codebase for recurring patterns (read-only)
2. Generates agent-agnostic **standards** and **commands** in `.codeplaybook/`
3. Deploys them into the active agent's rules and commands directories

### Inputs

| Variable | Description | Provided by |
|----------|-------------|-------------|
| `$AGENT_RULES_DIR` | Path where the agent stores rule files (e.g., `.claude/rules/`) | Agent adapter |
| `$AGENT_COMMANDS_DIR` | Path where the agent stores command files (e.g., `.claude/commands/`) | Agent adapter |
| `$AGENT_CONFIG_FILE` | Path to the agent's top-level configuration file (e.g., `CLAUDE.md`) | Agent adapter |
| Agent frontmatter format | The YAML frontmatter schema the agent uses for rule/command files | Agent adapter |

### Outputs

- Agent-agnostic standards in `.codeplaybook/standards/`
- Agent-agnostic commands in `.codeplaybook/commands/`
- Deployed rule files in `$AGENT_RULES_DIR`
- Deployed command files in `$AGENT_COMMANDS_DIR`
- Updated `$AGENT_CONFIG_FILE` with a Codeplaybook section

## Guarantees

- **Read-only analysis.** Analysis phase does not modify any project files.
- **Drafts before deployment.** All items are written as drafts first, allowing review before deployment.
- **Preserve existing.** Never overwrite existing artifacts. If a slug already exists, create `-2`, `-3`, etc.
- **Evidence required.** Every reported insight must include file-path evidence (and line ranges when feasible).
- **Focused output.** Max **7 Standards** and **5 Commands** generated per run.
- **Graceful failure.** Partial failures don't lose successful work; failed drafts are preserved.

## Definitions

- **Pattern (non-linter):** a convention a linter cannot reliably enforce (module boundaries, cross-domain communication, workflow parity, error semantics, etc).
- **Evidence:** `path[:line-line]` entries; omit line ranges only when the file isn't text-searchable.
- **Standard:** an agent-agnostic coding guideline with rules. Lives in `.codeplaybook/standards/`.
- **Command:** an agent-agnostic multi-step workflow. Lives in `.codeplaybook/commands/`.
- **Rule:** an agent-specific rule file derived from a standard. Lives in `$AGENT_RULES_DIR`.

---

## Step 0 — Introduction

Print exactly:

```
I'll start the codeplaybook onboarding process. I'll analyze your codebase and generate coding standards and commands as local files.
```

---

## Step 1 — Get Repository Name

Get the repository name:

```bash
basename "$(git rev-parse --show-toplevel)"
```

If this fails, the project is not a git repository. Print:

```
This project is not a git repository. Please run `git init` first, then re-run this workflow.
```

Exit the workflow.

Remember the result as `$REPO_NAME`.

---

## Step 2 — Announce

Print exactly:

```
codeplaybook-onboard — analyzing codebase (read-only)
Repository: $REPO_NAME
Output: .codeplaybook/standards/ and .codeplaybook/commands/
Deploy target: $AGENT_RULES_DIR and $AGENT_COMMANDS_DIR
```

---

## Step 3 — Detect Existing Configuration

Before analyzing, detect and preserve any existing configuration.

### Glob (broad, future-proof)
Glob for markdown in these roots (recursive):
- `.codeplaybook/**/*.md`
- `$AGENT_RULES_DIR/**/*.md`
- `$AGENT_COMMANDS_DIR/**/*.md`
- `.agents/**/*.md`
- `**/skills/**/*.md`
- `**/rules/**/*.md`

### Classify
Classify found files into counts:
- **standards**: `.codeplaybook/standards/**/*.md` (excluding `_drafts`)
- **commands**: `.codeplaybook/commands/**/*.md` (excluding `_drafts`)
- **rules**: `$AGENT_RULES_DIR/**/*.md`
- **agent_commands**: `$AGENT_COMMANDS_DIR/**/*.md`
- **other_docs**: any markdown under agent-specific skill directories, `.agents/`, or other agent directories

If any exist, print exactly:

```
Existing configuration detected:

    Standards (.codeplaybook/): [N]
    Commands (.codeplaybook/): [M]
    Rules ($AGENT_RULES_DIR): [P]
    Agent Commands ($AGENT_COMMANDS_DIR): [Q]
    Other docs: [R]
```

No overwrites. New files will be added next to the existing ones.

---

## Step 4 — Detect Project Stack (Minimal, Evidence-Based)

### Language markers (check presence)
- JS/TS: `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `tsconfig.json`
- Python: `pyproject.toml`, `requirements.txt`, `setup.py`
- Go: `go.mod`
- Rust: `Cargo.toml`
- Ruby: `Gemfile`
- JVM: `pom.xml`, `build.gradle`, `build.gradle.kts`
- .NET: `*.csproj`, `*.sln`
- PHP: `composer.json`

### Framework markers (check dependencies in package.json, go.mod, pom.xml, etc.)
- React: `react` in dependencies
- Next.js: `next` in dependencies, `next.config.*`
- Vue: `vue` in dependencies, `nuxt.config.*`
- Angular: `@angular/core` in dependencies, `angular.json`
- Svelte/SvelteKit: `svelte` in dependencies, `svelte.config.*`
- NestJS: `@nestjs/core` in dependencies
- Express: `express` in dependencies
- FastAPI: `fastapi` in requirements/pyproject
- Django: `django` in requirements/pyproject
- Spring: `spring-boot` in pom.xml/build.gradle
- gRPC: `@grpc/grpc-js`, `grpc` in dependencies, `*.proto` files
- GraphQL: `graphql`, `@apollo`, `type-graphql` in dependencies, `*.graphql` files

### Architecture markers (check directories)
- Hexagonal/DDD: `src/application/`, `src/domain/`, `src/infra/`
- Layered/MVC: `src/controllers/`, `src/services/`
- Frontend: `src/components/`, `src/hooks/`, `src/pages/`, `app/`
- Monorepo: `packages/`, `apps/`

Print exactly:

```
Stack detected (heuristic):

    Languages: [..]
    Frameworks: [..|none]
    Repo shape: [monorepo|single]
    Architecture markers: [..|none]
```

---

## Step 5 — Select & Run Analyses

### Step 5a — Present analyses with recommendations

Using the stack detected in Step 4, recommend which analyses are relevant. Mark each as recommended `[✓]` or optional `[ ]` based on the recommendation logic below.

#### Recommendation logic

| # | Analysis | Recommend when | Skip when |
|---|----------|---------------|-----------|
| 1 | Code Scaffolding | Always | — |
| 2 | Architecture Boundaries | Layered/DDD/MVC markers OR backend framework detected | — |
| 3 | Testing Practices | Always | — |
| 4 | Development Workflow | CI config files detected (`.github/workflows/`, `.gitlab-ci.yml`, etc.) | No CI config found |
| 5 | Error Handling | Always | — |
| 6 | Import & Module Patterns | JS/TS or Python detected | Go, Rust, Java (import ordering handled by tooling) |

Print exactly (with `[✓]`/`[ ]` based on recommendation logic):

```
Available analyses (recommended based on your stack):

  1. [✓] Code Scaffolding
     Finds repeating file structures (controllers, services, components, etc.)
     and generates scaffolding commands so new files follow the same template.
     Outputs: commands + standards

  2. [✓] Architecture Boundaries
     Checks if files respect their architectural role — e.g., controllers
     doing only HTTP, services containing business logic, repos handling
     data access. Flags files with mixed responsibilities.
     Outputs: standards + commands

  3. [✓] Testing Practices
     Analyzes test coverage (do source files have tests?), how test data is
     built (shared factories vs inline mocks), and test file structure
     (framework, assertions, setup patterns).
     Outputs: standards + commands

  4. [ ] Development Workflow
     Compares CI pipeline steps against locally available scripts. Flags
     CI checks that can't be reproduced locally — the "works on my machine"
     gaps. Generates a pre-PR quality check command.
     Outputs: commands

  5. [✓] Error Handling
     Detects how errors are created and propagated (throw vs return vs
     callback). Flags empty catch blocks, inconsistent error response
     shapes, and missing error context in logs.
     Outputs: standards

  6. [ ] Import & Module Patterns
     Checks import ordering conventions (external → internal → relative),
     barrel file usage (index.ts / __init__.py), path aliases (@/, ~/),
     and circular dependency tooling.
     Outputs: standards
```

Then ask via AskUserQuestion with options:
- **Run recommended** — run only the `[✓]` analyses
- **Run all** — run all 6 analyses
- **Custom** — "tell me which numbers to run (e.g., 1, 3, 5)"

### Step 5b — Run selected analyses

For each selected analysis, read the corresponding reference file for detailed search patterns, thresholds, and insight templates.

Pass the detected stack from Step 4 (languages, frameworks, architecture markers) as context. Use this to **prioritize relevant patterns** — e.g., skip Go patterns in a pure TypeScript project, focus on gRPC patterns if `.proto` files were detected, prioritize frontend boundary checks if React/Vue/Angular was found.

| # | Analysis | Reference File |
|---|----------|----------------|
| 1 | Code Scaffolding | [`$AGENT_ANALYSES_DIR/code-scaffolding.md`]($AGENT_ANALYSES_DIR/code-scaffolding.md) |
| 2 | Architecture Boundaries | [`$AGENT_ANALYSES_DIR/architecture-boundaries.md`]($AGENT_ANALYSES_DIR/architecture-boundaries.md) |
| 3 | Testing Practices | [`$AGENT_ANALYSES_DIR/testing-practices.md`]($AGENT_ANALYSES_DIR/testing-practices.md) |
| 4 | Development Workflow | [`$AGENT_ANALYSES_DIR/dev-workflow.md`]($AGENT_ANALYSES_DIR/dev-workflow.md) |
| 5 | Error Handling | [`$AGENT_ANALYSES_DIR/error-handling.md`]($AGENT_ANALYSES_DIR/error-handling.md) |
| 6 | Import & Module Patterns | [`$AGENT_ANALYSES_DIR/import-patterns.md`]($AGENT_ANALYSES_DIR/import-patterns.md) |

Skip any analysis the user did not select.

### Output schema (internal; do not print as-is to user)
For every finding, keep an internal record:

```
INSIGHT:
title: ...
why_it_matters: ...
confidence: [high|medium|low]
evidence:
- path[:line-line]
where_it_doesnt_apply:
- path[:line-line]
```

---

## Step 6 — Generate Drafts (Agent-Agnostic)

Generate all draft files in one batch. These are **agent-agnostic** — they describe the standard or command in plain terms, not tied to any specific AI agent format.

### Skip already-prescribed standards

Before generating a standard draft, check if `.codeplaybook/standards/` already has a standard covering the same topic (by reading existing standard names and scopes). If a prescribed standard already exists for a concern (e.g., architecture boundaries, layer structure), **skip generating** a discovered standard for that same concern. This prevents the onboard workflow from conflicting with standards created by a prescribe workflow.

### Standard Draft Format

For each Standard insight, create a Markdown file at `.codeplaybook/_drafts/standards/{slug}.md`:

```markdown
# {Standard Name}

{Description of what the standard covers and why it matters. Reference the evidence found during analysis.}

## Scope

{Where this standard applies, e.g. "TypeScript files in src/", "React components", "All test files". Be specific based on evidence.}

## Rules

* {Rule 1 — start with imperative verb, max ~25 words}
* {Rule 2}
* {Rule 3}
```

### Command Draft Format

For each Command insight, create a Markdown file at `.codeplaybook/_drafts/commands/{slug}.md`:

```markdown
# {Command Name}

{What the command does, why it's useful, and when it's relevant.}

## When to Use

- {Scenario 1}
- {Scenario 2}
- {Scenario 3}

## Context Validation Checkpoints

- {Question to validate before proceeding}
- {Another question}

## Steps

### 1. {Step Name}

{Description of what this step does and how to implement it.}

### 2. {Step Name}

{Description}
```

### Generation Rules

- Generate drafts **only from discovered insights** (no invention)
- Use evidence from analysis to populate rules/steps
- Cap output: max **7 Standards** + **5 Commands**
- Never overwrite existing files; append `-2`, `-3`, etc. if slug exists
- Slug: `codeplaybook-` prefix + lowercase, hyphenated name (e.g., "Test Data Factories" becomes `codeplaybook-test-data-factories`)

---

## Step 7 — Present Summary & Confirm

Present the generated draft files and ask for confirmation:

```
============================================================
  ANALYSIS COMPLETE
============================================================

Repository: $REPO_NAME
Stack detected: [languages], [monorepo?], [architecture markers]
Analyses run: [N] of 6

DRAFTS CREATED:

Standards ([N]):
  1. [Name] -> .codeplaybook/_drafts/standards/[slug].md
  2. ...

Commands ([M]):
  1. [Name] -> .codeplaybook/_drafts/commands/[slug].md
  2. ...

Drafts are saved in .codeplaybook/_drafts/ — you can review
or edit them before deploying.
============================================================
```

Then ask via AskUserQuestion with three options:

- **Deploy all now** — Save standards/commands to `.codeplaybook/` and deploy rules to the agent
- **Let me review drafts first** — Pause to allow editing, re-run workflow when ready
- **Cancel** — Exit without deploying anything

### If "Let me review drafts first"

Print:
```
Draft files ready for review at:
  - .codeplaybook/_drafts/standards/
  - .codeplaybook/_drafts/commands/

Edit them as needed, then re-run this workflow to continue.
```

Exit the workflow.

### If "Cancel"

Print:
```
Onboarding cancelled.
Draft files remain at .codeplaybook/_drafts/ if you want to review them later.
```

Exit the workflow.

---

## Step 8 — Deploy (Two Stages)

If user selected "Deploy all now", execute both stages.

### Stage 1: Save agent-agnostic standards and commands

Move drafts from `.codeplaybook/_drafts/` to their permanent agent-agnostic locations:

1. Create directories if needed:
   ```bash
   mkdir -p .codeplaybook/standards .codeplaybook/commands
   ```

2. For each standard draft:
   ```bash
   mv .codeplaybook/_drafts/standards/{slug}.md .codeplaybook/standards/{slug}.md
   ```

3. For each command draft:
   ```bash
   mv .codeplaybook/_drafts/commands/{slug}.md .codeplaybook/commands/{slug}.md
   ```

4. Clean up the `_drafts` directory:
   ```bash
   rm -rf .codeplaybook/_drafts
   ```

### Stage 2: Deploy to agent

Convert agent-agnostic files into the agent's specific format.

#### Standards -> Rules

For each `.codeplaybook/standards/{slug}.md`, create a rule file at `$AGENT_RULES_DIR/codeplaybook-{slug}.md`:

1. Create directory:
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

3. Write the rule file using the agent's frontmatter format (provided by the agent adapter). The file must contain:
   - The agent-specific frontmatter with the extracted `description` and `globs`
   - The standard name as a heading
   - The description paragraph
   - The rules list

If the standard has no meaningful scope restriction, omit the `globs` field from the frontmatter.

#### Commands -> Agent Commands

For each `.codeplaybook/commands/{slug}.md`, create a command file at `$AGENT_COMMANDS_DIR/{slug}.md`:

1. Create directory:
   ```bash
   mkdir -p $AGENT_COMMANDS_DIR
   ```

2. Read the command file. Extract:
   - **description**: Use the first paragraph (under `# {Name}`) as the description

3. Write the agent command file using the agent's frontmatter format (provided by the agent adapter). The file must contain:
   - The agent-specific frontmatter with the extracted `description`
   - The rest of the command content: When to Use, Context Validation Checkpoints, Steps sections

#### Collision handling

If `$AGENT_RULES_DIR/codeplaybook-{slug}.md` or `$AGENT_COMMANDS_DIR/{slug}.md` already exists, append `-2`, `-3`, etc. to the filename until a free name is found.

---

## Step 9 — Update Agent Configuration

After deploying, ensure the generated rules and commands are surfaced in the agent's configuration file (`$AGENT_CONFIG_FILE`) so the agent always sees them. This file is loaded into every conversation and is the highest-priority context.

### Logic

1. If `$AGENT_CONFIG_FILE` exists, read it and check if a `## Codeplaybook` section already exists
2. If the section exists, **replace it entirely** with the updated content below
3. If the section doesn't exist, **append** the content below at the end of the file
4. If `$AGENT_CONFIG_FILE` doesn't exist at all, **create it** with just this section

### Content to write

Generate the following section, filling in the actual standards and commands that were deployed:

```markdown
## Codeplaybook

### Coding Standards

Always review the rules in `$AGENT_RULES_DIR` before implementing any feature or fix.

{for each deployed standard, one line:}
- **{Standard Name}**: {first sentence of the standard's description}
{end for}

### Available Commands

{for each deployed command, one line:}
- `/{slug}` — {first sentence of the command's description}
{end for}
```

Keep it concise — one line per standard, one line per command. The goal is a quick-scan reference, not a full description.

---

## Step 10 — Completion Summary

Print the completion summary:

```
============================================================
  ONBOARDING COMPLETE
============================================================

Repository: $REPO_NAME
Created: [N] standards, [M] commands

Agent-agnostic files (source of truth):

Standards:
  - [Name] -> .codeplaybook/standards/[slug].md

Commands:
  - [Name] -> .codeplaybook/commands/[slug].md

Agent-deployed files:

Rules:
  - [Name] -> $AGENT_RULES_DIR/codeplaybook-[slug].md

Commands:
  - [Name] -> $AGENT_COMMANDS_DIR/[slug].md

$AGENT_CONFIG_FILE updated with Codeplaybook section.

Next steps:
  - Your AI coding assistant will automatically pick up the new rules
  - Commands are available via the agent's command interface
  - Edit .codeplaybook/standards/ or .codeplaybook/commands/ to update the source
  - Re-run this workflow to re-deploy changes to the agent
============================================================
```

### Partial success

If some files failed to deploy, print:

```
============================================================
  ONBOARDING COMPLETED WITH ERRORS
============================================================

Created: [N] standards, [M] commands
Failed: [X] items

Failed items:
  - [item-name]: [error message]

Failed drafts remain in .codeplaybook/_drafts/ for review.
============================================================
```

### No patterns discovered

If analysis found no patterns meeting the reporting thresholds:

```
============================================================
  NO PATTERNS DISCOVERED
============================================================

The analysis didn't find enough recurring patterns to generate
standards or commands.

This can happen with smaller codebases or projects with very
diverse coding styles. You can try again later as the codebase
grows.
============================================================
```

---

## Edge Cases

### Not a git repository

Handled in Step 1. Exit immediately.

### Draft directory already exists

If `.codeplaybook/_drafts/` exists from a previous run, ask via AskUserQuestion:
- "Previous drafts found. Overwrite and start fresh?"
- "Review existing drafts and deploy them?"

If overwrite: delete `.codeplaybook/_drafts/` and proceed normally.
If review: skip to Step 7 (present summary of existing drafts).

### No write permissions

If directory creation or file writing fails:

```
Failed to write files. Please check directory permissions and try again.
```

Exit the workflow.
