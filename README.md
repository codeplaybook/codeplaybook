# Codeplaybook

Agent-agnostic coding standards for any codebase. One source of truth, deployed to Claude Code, Cursor, or GitHub Copilot.

Discover patterns from existing code or prescribe architecture upfront. Standards live in `.codeplaybook/` as plain markdown -- portable, editable, and not locked into any single tool.

## Install

```bash
npx codeplaybook init
```

The CLI detects which coding agents you use and installs the right skills automatically.

**Supported agents:** Claude Code, Cursor, GitHub Copilot

**Alternative install (from GitHub):**
```bash
npx github:codeplaybook/codeplaybook init
```

## How It Works

```
npx codeplaybook init
  → detects your agent (Claude Code, Cursor, Copilot)
  → installs skills for that agent

/codeplaybook-prescribe
  → pick an architecture (hexagonal, clean, feature slices)
  → generates standards + commands in .codeplaybook/

/codeplaybook-onboard
  → analyzes your codebase for recurring patterns
  → generates standards + commands in .codeplaybook/

/codeplaybook-sync
  → re-deploys .codeplaybook/ to your agent's format
```

### Two Modes

**Prescribe** — Declare your architectural intent upfront. Pick a blueprint, get standards and commands generated from curated patterns. Best for new projects or adopting a new architecture.

**Discover** — Scan your codebase for recurring patterns and generate standards from what already exists. Best for established projects with conventions worth preserving.

Both output to `.codeplaybook/` (agent-agnostic). Use them together: prescribe first, then discover finds additional patterns on top.

## What Gets Generated

```
your-project/
├── .codeplaybook/                    ← agent-agnostic source of truth
│   ├── standards/
│   │   ├── codeplaybook-hexagonal-layers.md
│   │   └── codeplaybook-test-conventions.md
│   └── commands/
│       ├── codeplaybook-create-usecase.md
│       └── codeplaybook-pre-pr-check.md
│
├── .claude/rules/codeplaybook-*.md   ← Claude Code deployment
├── .cursor/rules/codeplaybook-*.md   ← Cursor deployment
└── .github/instructions/codeplaybook-*.md  ← Copilot deployment
```

Edit files in `.codeplaybook/`, then run `/codeplaybook-sync` to re-deploy to your agent.

## Architectural Blueprints

| Blueprint | What It Prescribes |
|-----------|-------------------|
| **Hexagonal** (Ports & Adapters) | Domain/Application/Infrastructure layers, port interfaces, adapter implementations |
| **Clean Architecture** | Entities/Use Cases/Adapters/Frameworks with strict dependency rule |
| **Feature Slices** | Feature-based directories, shared kernel, feature isolation |
| **Frontend Component Architecture** | Component layers, data layer, state management, shared UI |

Each blueprint includes framework-specific variants for NestJS, Spring Boot, FastAPI, Express, Go, Next.js, React, Vue, Angular, and Svelte.

## Codebase Analyses

| Analysis | What It Discovers |
|----------|-------------------|
| **Code Scaffolding** | Repeating file structures (controllers, services, components) |
| **Architecture Boundaries** | Files with mixed responsibilities |
| **Testing Practices** | Test coverage gaps, data construction patterns |
| **Development Workflow** | CI steps that can't run locally |
| **Error Handling** | Inconsistent error propagation, swallowed errors |
| **Import Patterns** | Import ordering, barrel files, path aliases |

## Contributing

We welcome contributions! The easiest ways to contribute:

- **Add a blueprint** — New architectural pattern (MVC, event-driven, microservices). Copy `blueprints/_template.md`.
- **Add a framework variant** — Add Django support to the hexagonal blueprint, etc.
- **Add an analysis** — New code analysis type (security patterns, accessibility). Copy `analyses/_template.md`.
- **Add an agent adapter** — Support for Continue.dev, Windsurf, Codex, etc.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Supported Languages & Frameworks

**Backend:** TypeScript/NestJS, Python/Django/FastAPI, Go, Java/Spring, Ruby/Rails, Rust, PHP, .NET

**Frontend:** React, Next.js, Vue/Nuxt, Angular, Svelte/SvelteKit, SolidJS

**Transports:** REST, gRPC, GraphQL, message queues

## License

[MIT](LICENSE)
