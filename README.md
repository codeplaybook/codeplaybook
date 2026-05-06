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

- **Onboard** your project — scan your existing code for patterns, or pick an architectural blueprint to start with pre-built standards. One command, two paths.
- **Audit** your code against those standards — find violations, fix them with confirmation.
- **Sync** everywhere — one source of truth, deployed to Claude Code, Cursor, Copilot, and Codex automatically.

No cloud. No database. Just local markdown files you own and control.

## Install

```bash
npx codeplaybook init
```

The CLI detects which coding agents you use and installs the right skills automatically.

**Supported agents:** Claude Code, Cursor, GitHub Copilot, OpenAI Codex

**Alternative install (from GitHub):**
```bash
npx github:codeplaybook/codeplaybook init
```

## How It Works

```
npx codeplaybook init
  → detects your agent (Claude Code, Cursor, Copilot)
  → installs skills for that agent

/codeplaybook-onboard
  → choose: scan your code or pick a blueprint
  → generates standards in .codeplaybook/

/codeplaybook-audit
  → scans codebase against your standards
  → reports violations, offers to fix them

/codeplaybook-sync
  → re-deploys .codeplaybook/ to your agent's format
```

### Three Workflows

**Onboard** — Set up coding standards for your project. Choose your path: scan your existing code to discover conventions you already follow, or pick an architectural blueprint to start with pre-built standards. You can do both — scan first, then layer a blueprint on top.

**Audit** — Check if your codebase actually follows the standards. Reports violations with file paths and line numbers. Offers to fix them with your confirmation.

**Sync** — Re-deploy standards from `.codeplaybook/` to your agent's format after manual edits.

Use them together: onboard sets up your standards, then audit enforces them over time.

## What Gets Generated

```
your-project/
├── .codeplaybook/                    ← agent-agnostic source of truth
│   └── standards/
│       ├── codeplaybook-hexagonal-layers.md
│       └── codeplaybook-test-conventions.md
│
├── .claude/rules/codeplaybook-*.md   ← Claude Code deployment
├── .cursor/rules/codeplaybook-*.md   ← Cursor deployment
├── .github/instructions/codeplaybook-*.md  ← Copilot deployment
└── .codex/rules/codeplaybook-*.md    ← Codex deployment
```

Edit files in `.codeplaybook/`, then run `/codeplaybook-sync` to re-deploy to your agent.

## Audit Dashboard

Track violations over time with a local web dashboard:

```bash
npx codeplaybook dashboard
```

The dashboard shows:
- Violations grouped by severity (Critical / High / Medium / Low)
- Trend chart across audit runs
- Code snippets showing exactly where violations occur
- **Copy Fix Prompt** — select violations, click copy, paste into your agent to fix them

Audit results are saved automatically to `.codeplaybook/audit.db` each time you run `/codeplaybook-audit`.

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
