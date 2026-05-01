# Codeplaybook

**Your coding standards, written once, deployed to every AI agent.**

### The problem

Your AI agent writes code that *works* — but over time, your codebase turns into a mess:

- Services that mix database calls with business logic
- Components that fetch data, manage state, and render — all in one file
- Three different error handling styles across the same project
- Test files that follow no consistent pattern

The code compiles. The tests pass. But **every file looks like it was written by a different person** — because it was. A different conversation, a different prompt, a different day.

Six months in, you're not building anymore. You're untangling.

**The root cause?** Your architecture rules, naming conventions, and patterns aren't written down anywhere your agent can see them. They're in your head, in old PR comments, in Slack threads nobody reads.

And if you *do* write rules — now you're maintaining them in 3 places:

- `.claude/rules/` for Claude Code
- `.cursor/rules/` for Cursor
- `.github/instructions/` for Copilot

Different formats. Different folders. Same content copied over and over.

### The fix

**Codeplaybook generates your standards once in `.codeplaybook/` and deploys them to every agent you use.**

- **Prescribe** architecture upfront — pick hexagonal, clean architecture, or feature slices and get standards generated from curated blueprints. Your agent follows the rules from day one.
- **Onboard** your existing codebase — scan for recurring patterns and turn them into enforceable standards.
- **Sync** everywhere — one source of truth, deployed to Claude Code, Cursor, and Copilot automatically.

No cloud. No database. Just local markdown files you own and control.

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

**Onboard** — Scan your codebase for recurring patterns and discover conventions worth preserving. Generates standards from what already exists. Best for established projects.

Both output to `.codeplaybook/` (agent-agnostic). Use them together: prescribe first, then onboard finds additional patterns on top.

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

New blueprints, analyses, framework variants, and agent adapters are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Supported Languages & Frameworks

**Backend:** TypeScript/NestJS, Python/Django/FastAPI, Go, Java/Spring, Ruby/Rails, Rust, PHP, .NET

**Frontend:** React, Next.js, Vue/Nuxt, Angular, Svelte/SvelteKit, SolidJS

**Transports:** REST, gRPC, GraphQL, message queues

## License

[MIT](LICENSE)
