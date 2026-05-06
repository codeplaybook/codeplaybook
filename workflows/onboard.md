# Onboard Workflow

Set up coding standards for your project — either by scanning existing code for patterns or by picking an architectural blueprint.

## Overview

This workflow provides a single entry point for generating coding standards:
1. Detects your project stack and existing configuration
2. Asks how you'd like to set up standards (scan code or pick a blueprint)
3. Generates agent-agnostic **standards** in `.codeplaybook/`
4. Deploys them into the active agent's rules directory

### Inputs

| Variable | Description | Provided by |
|----------|-------------|-------------|
| `$AGENT_RULES_DIR` | Path where the agent stores rule files (e.g., `.claude/rules/`) | Agent adapter |
| `$AGENT_CONFIG_FILE` | Path to the agent's top-level configuration file (e.g., `CLAUDE.md`) | Agent adapter |
| Agent frontmatter format | The YAML frontmatter schema the agent uses for rule files | Agent adapter |

### Outputs

- Agent-agnostic standards in `.codeplaybook/standards/`
- Deployed rule files in `$AGENT_RULES_DIR`
- Updated `$AGENT_CONFIG_FILE` with a Codeplaybook section

## Guarantees

- **Read-only analysis.** The scan path does not modify any project files during analysis.
- **Drafts before deployment.** All items are written as drafts first (scan path) or to `.codeplaybook/` directly (blueprint path), allowing review before agent deployment.
- **Preserve existing.** Never overwrite existing artifacts. If a slug already exists, skip that concern (scan path) or append `-2`, `-3`, etc. (blueprint path).
- **Evidence required.** Every insight from the scan path must include file-path evidence (and line ranges when feasible).
- **Focused output.** Max **7 Standards** generated per run (scan path). Blueprint path generates what the blueprint defines.
- **Graceful failure.** Partial failures don't lose successful work; failed drafts are preserved.

## Definitions

- **Pattern (non-linter):** a convention a linter cannot reliably enforce (module boundaries, cross-domain communication, workflow parity, error semantics, etc).
- **Evidence:** `path[:line-line]` entries; omit line ranges only when the file isn't text-searchable.
- **Standard:** an agent-agnostic coding guideline with rules. Lives in `.codeplaybook/standards/`.
- **Rule:** an agent-specific rule file derived from a standard. Lives in `$AGENT_RULES_DIR`.
- **Blueprint:** a curated architectural template that generates standards for a specific architecture style.

---

## Step 0 — Introduction

Print exactly:

```
I'll help you set up coding standards for your project.
```

---

## Step 1 — Get Repository Name

Get the repository name:

```bash
basename "$(git rev-parse --show-toplevel)"
```

If this fails, the project is not a git repository. Print:

```
This project is not a git repository. Please run `git init` first, then run /codeplaybook-onboard again.
```

Exit the workflow.

Remember the result as `$REPO_NAME`.

---

## Step 2 — Detect Project Stack

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
- Go stdlib/Gin/Echo/Fiber: check go.mod imports
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

Remember the detected framework as `$FRAMEWORK` (e.g., "NestJS", "FastAPI", "Spring Boot"). If multiple frameworks are detected, note all of them. If no framework is detected, set `$FRAMEWORK` to "none".

---

## Step 3 — Detect & Ingest Existing Configuration

Before proceeding, scan for existing standards and agent-specific rule files. These serve as **input signal** for both the scan and blueprint paths.

### 3a — Glob for existing files

Glob for markdown in these roots (recursive):
- `.codeplaybook/**/*.md`
- `$AGENT_RULES_DIR/**/*.md`
- `.cursor/rules/**/*.md`
- `.cursorrules`
- `.github/instructions/**/*.md`
- `CLAUDE.md`, `AGENTS.md`
- `.agents/**/*.md`
- `**/skills/**/*.md`
- `**/rules/**/*.md`

### 3b — Classify

Classify found files into counts:
- **standards**: `.codeplaybook/standards/**/*.md` (excluding `_drafts`)
- **agent_rules**: Files in agent-specific rule directories (`.claude/rules/`, `.cursor/rules/`, `.github/instructions/`)
- **other_docs**: any markdown under agent-specific skill directories, `.agents/`, or other agent directories

### 3c — Ingest agent-specific rules

For each file found in agent-specific rule directories (`.cursor/rules/`, `.claude/rules/`, `.github/instructions/`, `.cursorrules`, and coding-standards sections in `CLAUDE.md`/`AGENTS.md`):

1. Read the file content
2. Extract any rules, guidelines, or constraints expressed in the file
3. Store them internally as **ingested rules** — these will be used when generating standards

Ingested rules serve as **evidence for discovered patterns** (scan path) and **context to avoid contradictions** (blueprint path).

### 3d — Print summary

If any exist, print exactly:

```
Existing configuration detected:

    Standards (.codeplaybook/): [N]
    Agent rules (ingested): [P] files from [list dirs where found]
    Other docs: [R]

Existing rules will be used as input signal.
```

---

## Step 4 — Choose Setup Path

Present the user with the following options and wait for their selection (use available interactive tools to ask questions to the user):

```
How would you like to set up standards?
```

Options:
- **Scan my code** — discover what conventions I already follow
- **Start with a blueprint** — pick an architecture style for my project

If the user selects **Scan my code**, proceed to **Step 5 (Scan Path)**.
If the user selects **Start with a blueprint**, proceed to **Step 10 (Blueprint Path)**.

---

# PATH A: SCAN MY CODE

---

## Step 5 — Select & Run Analyses

### Step 5a — Present analyses with recommendations

Using the stack detected in Step 2, recommend which analyses are relevant. Mark each as recommended `[Y]` or optional `[ ]` based on the recommendation logic below.

#### Recommendation logic

| # | Analysis | Recommend when | Skip when |
|---|----------|---------------|-----------|
| 1 | Code Scaffolding | Always | — |
| 2 | Architecture Boundaries | Layered/DDD/MVC markers OR backend framework detected | — |
| 3 | Testing Practices | Always | — |
| 4 | Development Workflow | CI config files detected (`.github/workflows/`, `.gitlab-ci.yml`, etc.) | No CI config found |
| 5 | Error Handling | Always | — |
| 6 | Import & Module Patterns | JS/TS or Python detected | Go, Rust, Java (import ordering handled by tooling) |

Print exactly (with `[Y]`/`[ ]` based on recommendation logic):

```
Available analyses (recommended based on your stack):

  1. [Y] Code Scaffolding
     Finds repeating file structures (controllers, services, components, etc.)
     and generates standards so new files follow the same template.
     Outputs: standards

  2. [Y] Architecture Boundaries
     Checks if files respect their architectural role — e.g., controllers
     doing only HTTP, services containing business logic, repos handling
     data access. Flags files with mixed responsibilities.
     Outputs: standards

  3. [Y] Testing Practices
     Analyzes test coverage (do source files have tests?), how test data is
     built (shared factories vs inline mocks), and test file structure
     (framework, assertions, setup patterns).
     Outputs: standards

  4. [ ] Development Workflow
     Compares CI pipeline steps against locally available scripts. Flags
     CI checks that can't be reproduced locally — the "works on my machine"
     gaps.
     Outputs: standards

  5. [Y] Error Handling
     Detects how errors are created and propagated (throw vs return vs
     callback). Flags empty catch blocks, inconsistent error response
     shapes, and missing error context in logs.
     Outputs: standards

  6. [ ] Import & Module Patterns
     Checks import ordering conventions (external -> internal -> relative),
     barrel file usage (index.ts / __init__.py), path aliases (@/, ~/),
     and circular dependency tooling.
     Outputs: standards
```

Then present the user with options and wait for their selection (use available interactive tools to ask questions to the user):
- **Run recommended** — run only the `[Y]` analyses
- **Run all** — run all 6 analyses
- **Custom** — "tell me which numbers to run (e.g., 1, 3, 5)"

### Step 5b — Run selected analyses

For each selected analysis, read the corresponding reference file for detailed search patterns, thresholds, and insight templates.

Pass the detected stack from Step 2 (languages, frameworks, architecture markers) as context. Use this to **prioritize relevant patterns** — e.g., skip Go patterns in a pure TypeScript project, focus on gRPC patterns if `.proto` files were detected, prioritize frontend boundary checks if React/Vue/Angular was found.

| # | Analysis | Reference File |
|---|----------|----------------|
| 1 | Code Scaffolding | [`$AGENT_ANALYSES_DIR/code-scaffolding.md`]($AGENT_ANALYSES_DIR/code-scaffolding.md) |
| 2 | Architecture Boundaries | [`$AGENT_ANALYSES_DIR/architecture-boundaries.md`]($AGENT_ANALYSES_DIR/architecture-boundaries.md) |
| 3 | Testing Practices | [`$AGENT_ANALYSES_DIR/testing-practices.md`]($AGENT_ANALYSES_DIR/testing-practices.md) |
| 4 | Development Workflow | [`$AGENT_ANALYSES_DIR/dev-workflow.md`]($AGENT_ANALYSES_DIR/dev-workflow.md) |
| 5 | Error Handling | [`$AGENT_ANALYSES_DIR/error-handling.md`]($AGENT_ANALYSES_DIR/error-handling.md) |
| 6 | Import & Module Patterns | [`$AGENT_ANALYSES_DIR/import-patterns.md`]($AGENT_ANALYSES_DIR/import-patterns.md) |

Reference files are located relative to this workflow file (in the same skill directory).

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

Generate all draft files in one batch. These are **agent-agnostic** — they describe the standard in plain terms, not tied to any specific AI agent format.

### Skip already-covered standards

Before generating a standard draft, check if `.codeplaybook/standards/` already has a standard covering the same topic (by reading existing standard names and scopes). If a standard already exists for a concern (e.g., architecture boundaries, layer structure), **skip generating** a new standard for that same concern. The developer already has one — they can edit it manually if they want more rules.

### Use ingested agent rules as evidence

When generating standards, incorporate rules ingested in Step 3c:
- If an ingested rule aligns with a discovered code pattern, include it in the generated standard (it's confirmed from two sources)
- If an ingested rule has no supporting code evidence but is clearly intentional (e.g., explicit architectural constraint), include it anyway — the developer wrote it for a reason
- Do not blindly copy all ingested rules — only include those relevant to the standard being generated

### Standard Draft Format

For each Standard insight, create a Markdown file at `.codeplaybook/_drafts/standards/{slug}.md`:

```markdown
# {Standard Name}

{Description of what the standard covers and why it matters. Reference the evidence found during analysis.}

## Severity

{Assign based on impact: architecture boundaries or security = High, consistency patterns = Medium, optional style preferences = Low}

## Scope

{Where this standard applies, e.g. "TypeScript files in src/", "React components", "All test files". Be specific based on evidence — reflect only the actual files where evidence was found, not a superset.}

## Rules

* {Rule 1 — start with imperative verb, max ~25 words}
* {Rule 2}
* {Rule 3}
```

### Evidence-Bound Generation

Every rule in a generated standard must be directly supported by a specific insight from the analysis. If the analysis found a pattern in services, the rule applies to services — do not broaden scope beyond what was observed. The `## Scope` section must reflect the actual files where evidence was found, not a superset.

### Generation Rules

- Generate drafts **only from discovered insights** (no invention)
- Use evidence from analysis to populate rules
- Cap output: max **7 Standards**
- Skip generating a standard if `.codeplaybook/standards/` already has one covering the same concern
- Slug: `codeplaybook-` prefix + lowercase, hyphenated name (e.g., "Test Data Factories" becomes `codeplaybook-test-data-factories`)

---

## Step 7 — Present Scan Results & Confirm

Present the generated draft files:

```
============================================================
  SCAN COMPLETE
============================================================

Repository: $REPO_NAME
Stack detected: [languages], [monorepo?], [architecture markers]
Analyses run: [N] of 6

DRAFTS CREATED:

Standards ([N]):
  1. [Name] -> .codeplaybook/_drafts/standards/[slug].md
  2. ...

Drafts are saved in .codeplaybook/_drafts/ — you can review
or edit them before deploying.
============================================================
```

Then present the user with options and wait for their selection (use available interactive tools to ask questions to the user):
- **Deploy all now** — Save standards to `.codeplaybook/` and deploy rules to the agent
- **Let me review drafts first** — Pause to allow editing, then deploy
- **Cancel** — Exit without deploying anything

### If "Let me review drafts first"

Print:
```
Draft files ready for review at:
  - .codeplaybook/_drafts/standards/

Let me know when you're done reviewing and I'll deploy them.
```

Wait for the user to respond. When they confirm, proceed to **Step 8 — Deploy**.

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

### Stage 1: Save agent-agnostic standards

Move drafts from `.codeplaybook/_drafts/` to their permanent agent-agnostic locations:

1. Create directories if needed:
   ```bash
   mkdir -p .codeplaybook/standards
   ```

2. For each standard draft:
   ```bash
   mv .codeplaybook/_drafts/standards/{slug}.md .codeplaybook/standards/{slug}.md
   ```

3. Clean up the `_drafts` directory:
   ```bash
   rm -rf .codeplaybook/_drafts
   ```

### Stage 2: Deploy to agent

Run the shared deployment logic in **Step 16 — Deploy to Agent**.

---

## Step 9 — Offer Blueprint on Top

After scan-based standards are deployed, offer the user the option to also apply an architectural blueprint to fill gaps.

Print:

```
Standards from your code scan have been deployed.

Would you also like to apply an architectural blueprint?
Blueprints add pre-built standards for a specific architecture style
(hexagonal, clean architecture, feature slices, etc.) that your
scan may not have captured.
```

Present the user with the following options and wait for their selection (use available interactive tools to ask questions to the user):
- **Yes, pick a blueprint** — Proceed to Step 10 (Blueprint Path). Standards generated from the blueprint will be added alongside the scan-generated ones.
- **No, I'm done** — Proceed to Step 17 (Completion Summary).

---

# PATH B: START WITH A BLUEPRINT

---

## Step 10 — Confirm Framework

If `$FRAMEWORK` was detected in Step 2 (not "none"), print:

```
Detected: [framework] ([language])
Is this correct? (yes / or tell me the correct framework)
```

Present the user with options and wait for their confirmation or correction (use available interactive tools to ask questions to the user).

If `$FRAMEWORK` is "none" (no framework detected), present the user with the question (use available interactive tools to ask questions to the user):

```
No framework detected. What framework are you using (or planning to use)?
```

With options for common frameworks + "Other" for custom input.

Update `$FRAMEWORK` with the confirmed or corrected value.

---

## Step 11 — Analyze Project Shape

Before recommending blueprints, analyze the project to provide an informed recommendation.

### 11a — Check for source files

Determine if the project has meaningful source code by checking for files in `src/`, `app/`, `internal/`, `lib/`, or the project root matching common source extensions (`.ts`, `.js`, `.py`, `.go`, `.rs`, `.java`, `.kt`, `.cs`).

If **no source files exist** (greenfield/empty project), skip to **11e — Greenfield Questions**.

### 11b — Directory structure scan

When source code exists, scan for these directory patterns:

| Pattern | Signal |
|---------|--------|
| `src/domain/`, `src/application/`, `src/infrastructure/` | Hexagonal |
| `src/entities/`, `src/usecases/`, `src/adapters/` | Clean Architecture |
| `src/features/*/`, `src/modules/*/` | Feature Slices |
| `src/components/`, `src/hooks/`, `src/pages/` | Frontend Component Architecture |
| `packages/*/`, `apps/*/` | Monorepo |

### 11c — Feature/domain count

Count distinct domain areas by looking at:
- Subdirectories in `features/`, `modules/`, or the main source root
- Naming clusters (files sharing a domain prefix: `user*`, `order*`, `payment*`)

### 11d — Deployment shape

- Monorepo: `packages/`, `apps/`, workspace config (`pnpm-workspace.yaml`, `turbo.json`, `lerna.json`)
- Single app: one `src/` root
- Frontend + backend split: both component-like and controller-like directories present

### 11e — Classify and recommend

**When source files exist**, map findings to a recommendation:

| Signal | Recommend |
|--------|-----------|
| domain/application/infrastructure dirs | Hexagonal |
| entities/usecases/adapters dirs | Clean Architecture |
| Multiple self-contained feature dirs with collocated layers | Feature Slices |
| components/hooks/pages with no backend | Frontend Component Architecture |
| Frontend + backend in same repo | Feature Slices (backend) + Frontend Component Architecture |
| No clear architecture signals | Show all, no recommendation |

Always suggest Cross-Cutting Concerns as a complementary blueprint (when available).

**When greenfield/empty** (11e — Greenfield Questions), present the user with (use available interactive tools to ask questions to the user):

```
Let's understand your project's architecture needs:

1. Is this primarily a backend, frontend, or full-stack project?
2. How many distinct domain areas do you expect? (1-2 / 3-5 / 6+)
3. Do you need multiple independently deployable services? (Yes / No / Not sure yet)
```

Map answers to recommendations:
- Backend + 1-2 domains + no microservices -> Hexagonal or Clean Architecture
- Backend + 3+ domains -> Feature Slices
- Frontend -> Frontend Component Architecture
- Full-stack -> Feature Slices + Frontend Component Architecture
- Microservices -> Flag that a microservices blueprint isn't available yet; recommend Feature Slices as closest fit

---

## Step 12 — Present Blueprint Recommendation

Read all blueprint files from the `$AGENT_BLUEPRINTS_DIR` directory (relative to this workflow file).

If Step 11 produced a recommendation, print:

```
============================================================
  ARCHITECTURE RECOMMENDATION
============================================================

Based on your project:
  [summary of analysis findings or intent answers]

Recommended: [Blueprint Name]
  [1-2 sentence reason why this fits]

Also recommended: Cross-Cutting Concerns (if available)
  Pairs with any architecture for error handling, logging, validation.

Other available blueprints:
  - [Other 1] — [one-line description]
  - [Other 2] — [one-line description]
============================================================
```

If Step 11 could not determine a recommendation (no clear signals), print all blueprints:

```
Selecting architecture for: $REPO_NAME
Framework: $FRAMEWORK

Available architectural blueprints:

  1. Hexagonal (Ports & Adapters)
     Separates domain logic from infrastructure through ports (interfaces)
     and adapters (implementations). Three layers: Domain, Application,
     Infrastructure. Best for backend services with multiple integrations.

  2. Clean Architecture
     Concentric layers with strict dependency rule — inner layers never
     depend on outer layers. Entities -> Use Cases -> Interface Adapters ->
     Frameworks. Best for complex domain logic with long-term maintainability.

  3. Feature Slices (Vertical)
     Organize by feature (users/, orders/, payments/) instead of by layer.
     Each slice is self-contained with its own controller, service, repo.
     Best for large codebases where features evolve independently.

  4. Frontend Component Architecture
     Separates presentational (UI-only) from container (data-aware)
     components, with dedicated data and state layers per feature.
     Best for frontend apps of any size — React, Vue, Angular, Svelte.
```

Present the user with the following options and wait for their selection (use available interactive tools to ask questions to the user):
- **Go with recommendation** — use the recommended blueprint(s) (only shown when a recommendation exists)
- **Pick different** — choose from all blueprints (e.g., "1" or "1,3" to combine)
- **Combine** — select multiple blueprints

Remember selected blueprints as `$BLUEPRINTS`.

---

## Step 13 — Generate Standards from Blueprint

For each selected blueprint, read the blueprint file. Extract:

1. **Standards**: Each `### Standard:` section becomes a standard file
2. **Framework variant**: Find the `### $FRAMEWORK` section under `## Framework Variants`. Apply its rules, directory mappings, and naming conventions to the standards.

### Merging framework variant into standards

When a framework variant exists:
- **Replace** generic directory paths with framework-specific ones
- **Add** framework-specific rules (decorators, annotations, etc.)
- **Keep** all generic rules that aren't overridden

### Use existing rules as context

When generating a standard from a blueprint, read existing standards (from `.codeplaybook/standards/` and ingested agent rules from Step 3c) as context. This helps the blueprint generation produce standards that complement (not contradict) what the developer already has. Existing files are never overwritten — if a slug already exists, append `-2`, `-3`, etc.

### Output format

Generate standards in `.codeplaybook/standards/{slug}.md`:

```markdown
# {Standard Name}

{Description from blueprint, mentioning the chosen framework}

## Severity

{Extract from the blueprint's #### Severity field. If absent, default to Medium.}

## Scope

{Derived from framework variant's directory mapping}

## Rules

* {Generic rule + framework-specific rules merged}
```

### Naming

- Slug: `codeplaybook-` prefix + lowercase, hyphenated name
- File name uses the slug (e.g., `codeplaybook-hexagonal-layers.md`)
- Never overwrite existing files; append `-2`, `-3` if slug exists

---

## Step 14 — Present Blueprint Results & Deploy

Print:

```
============================================================
  BLUEPRINT APPLIED
============================================================

Repository: $REPO_NAME
Framework: $FRAMEWORK
Blueprints: [selected blueprint names]

Standards ([N]):
  1. [Name] -> .codeplaybook/standards/[slug].md
  2. ...
============================================================
```

Then present the user with options and wait for their selection (use available interactive tools to ask questions to the user):
- **Deploy now** — Deploy to `$AGENT_RULES_DIR`, update agent configuration
- **Review first** — Let user edit files before deploying
- **Cancel** — Keep files in `.codeplaybook/` but don't deploy

### If "Deploy now"

Proceed to **Step 16 — Deploy to Agent**.

### If "Review first"

Print:

```
Standards saved to .codeplaybook/.
Edit them as needed, then run /codeplaybook-sync to deploy.
```

Exit the workflow.

### If "Cancel"

Print:

```
Blueprint cancelled. No files were modified.
```

Exit the workflow.

---

## Step 15 — (Reserved for future use)

---

# SHARED: DEPLOYMENT & COMPLETION

---

## Step 16 — Deploy to Agent

Convert agent-agnostic files into the agent's specific format.

### Standards -> Rules

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

### Collision handling

If `$AGENT_RULES_DIR/codeplaybook-{slug}.md` already exists, append `-2`, `-3`, etc. to the filename until a free name is found.

### Update Agent Configuration

After deploying, ensure the generated rules are surfaced in the agent's configuration file (`$AGENT_CONFIG_FILE`) so the agent always sees them. This file is loaded into every conversation and is the highest-priority context.

1. If `$AGENT_CONFIG_FILE` exists, read it and check if a `## Codeplaybook` section already exists
2. If the section exists, **replace it entirely** with the updated content below
3. If the section doesn't exist, **append** the content below at the end of the file
4. If `$AGENT_CONFIG_FILE` doesn't exist at all, **create it** with just this section

Generate the following section, filling in the actual standards that were deployed:

```markdown
## Codeplaybook

### Coding Standards

Always review the rules in `$AGENT_RULES_DIR` before implementing any feature or fix.

{for each deployed standard, one line:}
- **{Standard Name}**: {first sentence of the standard's description}
{end for}
```

**Do NOT** add directory structures, architecture descriptions, key rules summaries, or any other content to the agent configuration section. One line per standard. The `$AGENT_RULES_DIR` files contain the full detail.

---

## Step 17 — Completion Summary

Print the completion summary:

```
============================================================
  ONBOARDING COMPLETE
============================================================

Repository: $REPO_NAME
Created: [N] standards

Agent-agnostic files (source of truth):

Standards:
  - [Name] -> .codeplaybook/standards/[slug].md

Agent-deployed files:

Rules:
  - [Name] -> $AGENT_RULES_DIR/codeplaybook-[slug].md

$AGENT_CONFIG_FILE updated with Codeplaybook section.

Next steps:
  - Your AI coding assistant will automatically pick up the new rules
  - Edit .codeplaybook/standards/ to update the source
  - Run /codeplaybook-sync to re-deploy changes to the agent
============================================================
```

Then present the user with the question (use available interactive tools to ask questions to the user):

```
Would you like to audit your codebase against the new standards?
This will scan your code for violations and offer to fix them.
```

Options:
- **Run audit now** — Run `/codeplaybook-audit` immediately
- **Skip for now** — Exit (user can run audit later)

If "Run audit now": proceed to execute the audit workflow.

### Partial success

If some files failed to deploy, print:

```
============================================================
  ONBOARDING COMPLETED WITH ERRORS
============================================================

Created: [N] standards
Failed: [X] items

Failed items:
  - [item-name]: [error message]

Failed drafts remain in .codeplaybook/_drafts/ for review.
============================================================
```

### No patterns discovered (scan path only)

If analysis found no patterns meeting the reporting thresholds:

```
============================================================
  NO PATTERNS DISCOVERED
============================================================

The analysis didn't find enough recurring patterns to generate
standards.

This can happen with smaller codebases or projects with very
diverse coding styles. You can try again later as the codebase
grows, or select "Start with a blueprint" to pick an
architecture style instead.
============================================================
```

After this message, present the user with options (use available interactive tools to ask questions to the user):
- **Start with a blueprint** — Proceed to Step 10 (Blueprint Path)
- **Exit** — Exit the workflow

---

## Edge Cases

### Not a git repository

Handled in Step 1. Exit immediately.

### Draft directory already exists

If `.codeplaybook/_drafts/` exists from a previous run, present the user with options (use available interactive tools to ask questions to the user):
- **Overwrite and start fresh** — delete `.codeplaybook/_drafts/` and proceed normally
- **Deploy existing scan drafts** — skip to Step 7 (present summary of existing drafts), then deploy

### No write permissions

If directory creation or file writing fails:

```
Failed to write files. Please check directory permissions and try again.
```

Exit the workflow.
