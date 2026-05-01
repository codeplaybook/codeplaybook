# Getting Started

## Prerequisites

- Node.js 18 or later
- A coding agent installed in your project (Claude Code, Cursor, or GitHub Copilot)
- A git repository (`git init` if you don't have one)

## Install

```bash
npx codeplaybook init
```

This will:
1. Detect which coding agents you have (looks for `.claude/`, `.cursor/`, `.github/`)
2. Install codeplaybook skills for each detected agent
3. Print next steps

## Usage

### For new projects: Prescribe architecture

```
/codeplaybook-prescribe
```

Pick an architectural blueprint (hexagonal, clean architecture, feature slices, or frontend component architecture). Codeplaybook generates standards and commands in `.codeplaybook/`, then deploys them to your agent.

### For existing projects: Discover patterns

```
/codeplaybook-onboard
```

Codeplaybook analyzes your codebase for recurring patterns (file structures, architecture boundaries, testing practices, etc.) and generates standards from what it finds.

### After editing standards

```
/codeplaybook-sync
```

If you manually edit files in `.codeplaybook/standards/` or `.codeplaybook/commands/`, run sync to re-deploy to your agent's directory.

## What gets created

After running prescribe or onboard:

```
your-project/
├── .codeplaybook/           ← Your standards (agent-agnostic, commit this)
│   ├── standards/*.md
│   └── commands/*.md
├── .claude/rules/*.md       ← Claude Code deployment (auto-generated)
├── .cursor/rules/*.md       ← Cursor deployment (auto-generated)
└── .github/instructions/*.md ← Copilot deployment (auto-generated)
```

The `.codeplaybook/` directory is the source of truth. Agent-specific files are generated from it.

## Typical workflow

```
1. npx codeplaybook init                    # Install skills
2. /codeplaybook-prescribe                  # Set up architecture (hexagonal for NestJS)
3. /codeplaybook-onboard                    # Discover additional patterns
4. Edit .codeplaybook/standards/*.md        # Customize as needed
5. /codeplaybook-sync                       # Re-deploy after edits
```
