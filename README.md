# Codeplaybook

Generate coding standards and commands for your codebase as local files. Discover patterns from existing code or prescribe architecture upfront. Works with Claude Code — no cloud services, no packages, no databases.

## How it works

**Two modes:**

1. **Prescribe** (`/codeplaybook-prescribe`) — Declare your architectural intent (hexagonal, clean architecture, feature slices) and generate standards + commands from curated blueprints. Best for greenfield projects or adopting a new pattern.

2. **Discover** (`/codeplaybook-onboard`) — Scan your codebase for recurring patterns and generate standards + commands from what already exists. Best for existing projects with established conventions.

Both output to the same format. Use them together: prescribe first, then onboard discovers additional patterns on top.

## Architectural Blueprints

| Blueprint | What it prescribes |
|-----------|-------------------|
| Hexagonal (Ports & Adapters) | Domain/Application/Infrastructure layers, port interfaces, adapter implementations |
| Clean Architecture | Entities/Use Cases/Adapters/Frameworks with strict dependency rule |
| Feature Slices | Feature-based directories, shared kernel, feature isolation |
| Frontend Component Architecture | Component layers, data layer, state management, shared UI |

Each blueprint includes framework-specific variants for NestJS, Spring Boot, FastAPI, Express, Go, Next.js, React, Vue, Angular, and Svelte.

## Pattern Discovery

| Analysis | What it finds |
|----------|---------------|
| Code Scaffolding | Repeating file structures (controllers, services, components) |
| Architecture Boundaries | Files with mixed responsibilities |
| Testing Practices | Test coverage gaps, data construction patterns |
| Development Workflow | CI steps that can't run locally |
| Error Handling | Inconsistent error propagation, swallowed errors |
| Import Patterns | Import ordering, barrel files, path aliases |

## Installation

Copy the skills into your project's `.claude/skills/` directory:

```bash
mkdir -p <your-repo>/.claude/skills
cp -r skills/codeplaybook-prescribe <your-repo>/.claude/skills/
cp -r skills/codeplaybook-onboard <your-repo>/.claude/skills/
cp -r skills/codeplaybook-sync <your-repo>/.claude/skills/
```

## Usage

```
/codeplaybook-prescribe  # Declare architecture → generate standards from blueprints
/codeplaybook-onboard    # Analyze codebase → discover patterns → generate standards
/codeplaybook-sync       # Re-deploy after editing .codeplaybook/ source files
```

**Typical workflow:**
```
/codeplaybook-prescribe  → Pick "Hexagonal" for NestJS
/codeplaybook-onboard    → Discovers test conventions, CI gaps, etc.
/codeplaybook-sync       → Re-deploy after manual edits
```

## What gets generated

```
your-repo/
  .codeplaybook/                    # Agent-agnostic source of truth
    standards/
      codeplaybook-hexagonal-layers.md        (prescribed)
      codeplaybook-test-conventions.md        (discovered)
      ...
    commands/
      codeplaybook-create-usecase.md          (prescribed)
      codeplaybook-pre-pr-check.md            (discovered)
      ...
  .claude/                          # Claude Code deployment
    rules/
      codeplaybook-hexagonal-layers.md
      codeplaybook-test-conventions.md
      ...
    commands/
      codeplaybook-create-usecase.md
      codeplaybook-pre-pr-check.md
      ...
  CLAUDE.md                         # Updated with standards + commands index
```

## Editing standards

1. Edit files in `.codeplaybook/standards/` or `.codeplaybook/commands/`
2. Run `/codeplaybook-sync` to re-deploy to `.claude/`

You can also write your own standards manually — just create a `.md` file in `.codeplaybook/standards/` following the format (title, scope, rules) and sync.

## Supported languages & frameworks

Backend: TypeScript/NestJS, Python/Django/FastAPI/Flask, Go, Java/Spring, Kotlin, Ruby/Rails, Rust, PHP, .NET

Frontend: React, Next.js, Vue/Nuxt, Angular, Svelte/SvelteKit, SolidJS

Transports: REST, gRPC, GraphQL, message queues

## License

MIT
