# Getting Started

## Prerequisites

- Node.js 18 or later
- A coding agent installed in your project (Claude Code, Cursor, GitHub Copilot, or OpenAI Codex)
- A git repository (`git init` if you don't have one)

## Install

```bash
npx codeplaybook init
```

This will:
1. Detect which coding agents you have (looks for `.claude/`, `.cursor/`, `.github/`, `.codex/`, `AGENTS.md`)
2. Install codeplaybook skills for each detected agent
3. Print next steps

## Usage

### Set up standards

```
/codeplaybook-onboard
```

You'll be asked how you want to set up standards:

1. **Scan my code** — discovers conventions you already follow in your existing codebase
2. **Start with a blueprint** — pick an architectural style (hexagonal, clean architecture, feature slices, or frontend component architecture) and get pre-built standards

Both paths generate standards in `.codeplaybook/`, then deploy them to your agent.

### After editing standards

```
/codeplaybook-sync
```

If you manually edit files in `.codeplaybook/standards/`, run sync to re-deploy to your agent's directory.

## What gets created

After running onboard:

```
your-project/
├── .codeplaybook/           <- Your standards (agent-agnostic, commit this)
│   └── standards/*.md
├── .claude/rules/*.md       <- Claude Code deployment (auto-generated)
├── .cursor/rules/*.md       <- Cursor deployment (auto-generated)
├── .github/instructions/*.md <- Copilot deployment (auto-generated)
└── .codex/rules/*.md        <- Codex deployment (auto-generated)
```

The `.codeplaybook/` directory is the source of truth. Agent-specific files are generated from it.

## Typical workflow

```
1. npx codeplaybook init                    # Install skills
2. /codeplaybook-onboard                    # Scan code or pick a blueprint
3. Edit .codeplaybook/standards/*.md        # Customize as needed
4. /codeplaybook-sync                       # Re-deploy after edits
5. /codeplaybook-audit                      # Check code against standards
```
