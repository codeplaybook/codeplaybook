# Codeplaybook Open Source Architecture Design

**Date:** 2026-05-01
**Status:** Draft
**Author:** Shyam + Claude

---

## Context

Codeplaybook is a local-first, agent-agnostic system for generating coding standards and commands from architectural patterns or existing code discovery. It currently exists as a folder of Claude Code skills with no distribution mechanism, no versioning, and no open-source infrastructure.

**Goal:** Make codeplaybook ready for GitHub as an open-source project that indie developers can install and use, and that the community can contribute to by adding new blueprints, analyses, and agent adapters.

**Key decisions made:**
- Target audience: Indie developers (no team governance or registry for v1)
- Distribution: npm package with thin CLI (`npx codeplaybook init`)
- CLI scope: Installer only (transforms + installs, no standalone analysis)
- Agent support: Claude Code + Cursor + Copilot (v1)
- Multi-agent: One source of truth, CLI converts per agent format during init
- Architecture: `.codeplaybook/` is the canonical agent-agnostic format

---

## Architecture

### Data Flow

```
codeplaybook repo (npm package)
  blueprints/*.md        ← architectural patterns (shared)
  analyses/*.md          ← code analysis templates (shared)
  workflows/*.md         ← agent-agnostic skill logic (shared)
  agents/{name}.js       ← agent-specific adapters
       │
       ▼
  npx codeplaybook init
  (detects agent → transforms content → installs skills)
       │
       ├──▶ .claude/skills/codeplaybook-*/      (Claude Code)
       ├──▶ .cursor/rules/codeplaybook-*        (Cursor)
       └──▶ .github/instructions/codeplaybook-* (Copilot)

  Developer uses agent to run /codeplaybook-onboard or /codeplaybook-prescribe
       │
       ▼
  .codeplaybook/           ← THE standard (agent-agnostic, portable)
    standards/*.md
    commands/*.md
       │
       ▼  (sync/deploy)
  Agent-specific rules & commands rendered from .codeplaybook/
    .claude/rules/codeplaybook-*.md    (paths: frontmatter)
    .cursor/rules/codeplaybook-*.md    (globs: frontmatter)
    .github/instructions/codeplaybook-*.md (applyTo: frontmatter)
```

### Core Principle: Separation of Content from Delivery

The repo separates three concerns:

1. **Content** (blueprints, analyses) — the core value, agent-agnostic markdown
2. **Workflow** (onboard, prescribe, sync) — the logic for how content is applied, agent-agnostic
3. **Delivery** (agent adapters) — how content + workflow gets packaged for each coding agent

Contributors to content never need to think about agents. Contributors to agents never need to modify content.

---

## Repo Structure

```
codeplaybook/
├── README.md                          # Overview, quickstart, badges
├── LICENSE                            # MIT
├── CONTRIBUTING.md                    # How to contribute (per type)
├── CODE_OF_CONDUCT.md                 # Standard Contributor Covenant
├── CHANGELOG.md                       # Keep-a-changelog format
├── package.json                       # npm package, bin: codeplaybook
│
├── blueprints/                        # Architectural patterns
│   ├── _template.md                   # Template for new blueprints
│   ├── hexagonal.md
│   ├── clean-architecture.md
│   ├── feature-slices.md
│   └── frontend-component-architecture.md
│
├── analyses/                          # Codebase analysis templates
│   ├── _template.md                   # Template for new analyses
│   ├── code-scaffolding.md
│   ├── architecture-boundaries.md
│   ├── testing-practices.md
│   ├── dev-workflow.md
│   ├── error-handling.md
│   └── import-patterns.md
│
├── workflows/                         # Agent-agnostic skill logic
│   ├── onboard.md                     # Discovery workflow (detect → analyze → generate → deploy)
│   ├── prescribe.md                   # Blueprint prescription workflow
│   └── sync.md                        # Re-deploy from .codeplaybook/
│
├── agents/                            # Agent adapter modules
│   ├── claude.js                      # Claude Code adapter (SKILL.md format)
│   ├── cursor.js                      # Cursor adapter (.cursor/rules/ format)
│   ├── copilot.js                     # GitHub Copilot adapter (.github/instructions/ format)
│   └── adapter-spec.md               # Specification for building new adapters
│
├── format/
│   └── spec.md                        # .codeplaybook/ format specification
│
├── bin/
│   └── cli.js                         # CLI entry point
│
├── src/                               # CLI source code
│   ├── detect.js                      # Agent detection logic
│   ├── assemble.js                    # Content assembly logic
│   └── install.js                     # File installation logic
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── new-blueprint.yml          # Blueprint contribution template
│   │   ├── new-analysis.yml           # Analysis contribution template
│   │   ├── new-agent.yml              # Agent adapter template
│   │   └── bug-report.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── ci.yml                     # Lint, format, test adapters
│       └── release.yml                # npm publish on tag
│
└── docs/
    ├── getting-started.md
    ├── creating-blueprints.md
    ├── creating-analyses.md
    └── creating-agent-adapters.md
```

---

## CLI Design

### Commands

Only one command: `init`

```bash
npx codeplaybook init
```

### Init Flow

```
Step 1: Detect agents
  - Check for .claude/ directory → Claude Code
  - Check for .cursor/ directory → Cursor
  - Check for .github/ directory with copilot markers → Copilot
  - If none found → interactive prompt: "Which coding agent do you use?"

Step 2: Check existing installation
  - If .codeplaybook/ exists → warn "codeplaybook already initialized"
  - If agent skills already exist → ask "overwrite or skip?"

Step 3: Assemble and install per agent
  For each detected/selected agent:
    a. Load agent adapter (agents/{name}.js)
    b. Read workflow files (workflows/*.md)
    c. Read blueprints and analyses
    d. Call adapter.transform(workflows, blueprints, analyses)
    e. Write output to agent directory

Step 4: Summary
  Print installed skills and next steps
```

### Agent Adapter Interface

Each adapter module exports:

```javascript
module.exports = {
  name: 'claude',
  displayName: 'Claude Code',
  
  // How to detect this agent in a project
  detect(projectPath) {
    return fs.existsSync(path.join(projectPath, '.claude'));
  },
  
  // Transform content into agent-specific format
  transform(workflows, blueprints, analyses) {
    return [
      {
        path: '.claude/skills/codeplaybook-onboard/SKILL.md',
        content: wrapInSkillMd(workflows.onboard, { references: analyses })
      },
      {
        path: '.claude/skills/codeplaybook-prescribe/SKILL.md',
        content: wrapInSkillMd(workflows.prescribe, { blueprints })
      },
      {
        path: '.claude/skills/codeplaybook-sync/SKILL.md',
        content: wrapInSkillMd(workflows.sync)
      },
      // + copy blueprint/analysis files as references
    ];
  }
};
```

### Agent-Specific Output Formats

**Claude Code:**
```
.claude/skills/codeplaybook-onboard/
  SKILL.md                    # Full workflow with references
  references/
    code-scaffolding.md       # Analysis files copied here
    architecture-boundaries.md
    ...
.claude/skills/codeplaybook-prescribe/
  SKILL.md
  blueprints/
    hexagonal.md              # Blueprint files copied here
    ...
.claude/skills/codeplaybook-sync/
  SKILL.md
```

**Cursor:**
```
.cursor/rules/
  codeplaybook-onboard.md     # Workflow as rule file (globs: frontmatter)
  codeplaybook-prescribe.md   # With blueprint content embedded or referenced
  codeplaybook-sync.md
```

**GitHub Copilot:**
```
.github/instructions/
  codeplaybook-onboard.md     # Workflow as instruction (applyTo: frontmatter)
  codeplaybook-prescribe.md
  codeplaybook-sync.md
.github/prompts/
  codeplaybook-onboard.prompt.md  # As invocable prompts
  codeplaybook-prescribe.prompt.md
```

---

## .codeplaybook/ Format Specification

This is the agent-agnostic output that onboard/prescribe generate. It's the "standard" that the developer owns and can share.

### Directory Structure

```
.codeplaybook/
├── standards/
│   ├── {slug}.md              # One file per standard
│   └── ...
├── commands/
│   ├── {slug}.md              # One file per command
│   └── ...
└── _drafts/                   # Generated but not yet deployed
    ├── standards/
    └── commands/
```

### Standard Format

```markdown
# {Standard Name}

{Description - what this standard enforces and why}

## Scope

{Where this standard applies - file patterns, directories, etc.}

## Rules

* {Rule 1}
* {Rule 2}
* {Rule 3}
```

### Command Format

```markdown
# {Command Name}

{What this command does}

## When to Use

- {Scenario 1}
- {Scenario 2}

## Context Validation Checkpoints

- {Pre-condition check 1}
- {Pre-condition check 2}

## Steps

### 1. {Step Name}
{Description and sub-steps}

### 2. {Step Name}
{Description and sub-steps}
```

### Deployment Rules

When sync deploys from `.codeplaybook/` to agent directories:

| Agent | Standards → | Commands → | Frontmatter |
|---|---|---|---|
| Claude Code | `.claude/rules/codeplaybook-{slug}.md` | `.claude/commands/codeplaybook-{slug}.md` | `paths:` (YAML block), `alwaysApply`, `description` |
| Cursor | `.cursor/rules/codeplaybook-{slug}.md` | `.cursor/commands/codeplaybook-{slug}.md` | `globs:` (string), `alwaysApply` |
| Copilot | `.github/instructions/codeplaybook-{slug}.md` | `.github/prompts/codeplaybook-{slug}.prompt.md` | `applyTo:` |

---

## Contribution Model

### Contribution Types

#### 1. New Blueprint (Low barrier)

**What:** A new architectural pattern (e.g., MVC, event-driven, microservices)

**How:**
1. Copy `blueprints/_template.md`
2. Fill in: introduction, standards (with scope + rules), commands (with steps), framework variants
3. PR → CI validates format → review → merge

**Template structure:**
```markdown
# {Pattern Name}

## When to Use
{Scenarios where this pattern is appropriate}

## Standards

### Standard: {Name}
#### Scope
#### Rules

## Commands

### Command: {name}
#### When to Use
#### Steps

## Framework Variants

### NestJS
### Express
### FastAPI
(etc.)
```

#### 2. New Framework Variant (Low barrier)

**What:** Adding support for a framework to an existing blueprint

**How:**
1. Open existing blueprint file
2. Add a `### {Framework}` section under `## Framework Variants`
3. Include: directory mapping, naming conventions, framework-specific rules
4. PR → review → merge

#### 3. New Analysis (Medium barrier)

**What:** A new code analysis type (e.g., security patterns, accessibility, performance)

**How:**
1. Copy `analyses/_template.md`
2. Define: what patterns to look for, detection heuristics, reporting thresholds, output format
3. PR → review → merge

**Template structure:**
```markdown
# {Analysis Name}

## Purpose
{What this analysis detects and why it matters}

## Detection Patterns
{File patterns, naming conventions, code markers to look for}

## Analysis Logic
{How to classify findings, thresholds for reporting}

## Output Format
{How findings should be structured for standard/command generation}
```

#### 4. New Agent Adapter (Medium barrier)

**What:** Support for a new coding agent (e.g., Continue.dev, Windsurf, Codex)

**How:**
1. Read `agents/adapter-spec.md` for the interface
2. Create `agents/{name}.js` implementing detect + transform
3. Add agent detection to CLI
4. PR with docs → review → merge

#### 5. Content Improvements (Low barrier)

**What:** Fix, improve, or expand existing blueprints/analyses

**How:** Direct PR with changes. No template needed.

### CI Validation

GitHub Actions CI will:
1. **Format check** — blueprints and analyses follow expected structure (headings, sections)
2. **Adapter test** — CLI can successfully generate output for all supported agents
3. **No broken references** — workflow files don't reference missing blueprints/analyses
4. **Lint** — JavaScript source passes ESLint

---

## What Needs to Happen (Current → OSS-Ready)

### Phase 1: Restructure Content
- Move blueprints from `skills/codeplaybook-prescribe/blueprints/` → top-level `blueprints/`
- Move analyses from `skills/codeplaybook-onboard/references/` → top-level `analyses/`
- Extract agent-agnostic workflow logic from SKILL.md files → `workflows/`
- Create `format/spec.md` documenting the .codeplaybook/ format

### Phase 2: Build CLI
- Create `package.json` with `bin: { codeplaybook: './bin/cli.js' }`
- Implement agent detection (check for .claude/, .cursor/, .github/)
- Implement Claude Code adapter (transform workflows → SKILL.md format, bundle references)
- Implement Cursor adapter (transform workflows → .cursor/rules/ format)
- Implement Copilot adapter (transform workflows → .github/instructions/ format)
- Test: `npx . init` works in a sample project

### Phase 3: OSS Artifacts
- Add MIT LICENSE
- Write CONTRIBUTING.md with guides per contribution type
- Add CODE_OF_CONDUCT.md (Contributor Covenant)
- Create CHANGELOG.md
- Write README.md with: problem statement, quickstart, how it works, contributing
- Create .github/ISSUE_TEMPLATE/ (blueprint, analysis, agent, bug)
- Create .github/PULL_REQUEST_TEMPLATE.md
- Set up GitHub Actions CI

### Phase 4: Polish
- Add blueprint and analysis `_template.md` files
- Write `agents/adapter-spec.md`
- Write docs/ (getting-started, creating-blueprints, creating-analyses, creating-adapters)
- Create initial git repo, push to GitHub
- Publish to npm (or just GitHub-based npx for v1)

---

## Verification

- [ ] `npx codeplaybook init` works in a fresh project with Claude Code
- [ ] `npx codeplaybook init` works in a fresh project with Cursor
- [ ] `npx codeplaybook init` works in a fresh project with Copilot
- [ ] Installed Claude Code skills produce identical output to current SKILL.md files
- [ ] `/codeplaybook-onboard` generates valid `.codeplaybook/standards/` and `.codeplaybook/commands/`
- [ ] `/codeplaybook-prescribe` generates valid `.codeplaybook/standards/` from blueprints
- [ ] `/codeplaybook-sync` deploys from `.codeplaybook/` to all detected agent formats
- [ ] A contributor can add a new blueprint by following `blueprints/_template.md`
- [ ] A contributor can add a new analysis by following `analyses/_template.md`
- [ ] CI passes on a PR that adds a new blueprint
- [ ] README clearly explains what codeplaybook is, how to use it, and how to contribute
