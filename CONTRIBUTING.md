# Contributing to Codeplaybook

Thank you for your interest in contributing! Codeplaybook thrives on community contributions -- new blueprints, analyses, framework variants, and agent adapters. The project focuses purely on standards.

## Quick Start

1. Fork the repository
2. Create a branch (`git checkout -b add-mvc-blueprint`)
3. Make your changes
4. Test locally (`node bin/cli.js init` in a test project)
5. Submit a pull request

## What You Can Contribute

### New Blueprint (Low barrier)

Add a new architectural pattern (e.g., MVC, event-driven, microservices).

1. Copy `blueprints/_template.md`
2. Fill in all sections: introduction, standards, framework variants
3. Place in `blueprints/your-pattern.md`
4. Submit a PR

**Requirements:**
- At least 2 standards
- At least 2 framework variants
- Each standard needs Scope and Rules sections

### New Framework Variant (Low barrier)

Add support for a framework to an existing blueprint.

1. Open an existing blueprint file in `blueprints/`
2. Add a `### {Framework}` section under `## Framework Variants`
3. Include: directory mapping, naming conventions, framework-specific rules
4. Submit a PR

### New Analysis (Medium barrier)

Add a new code analysis type (e.g., security patterns, accessibility, performance).

1. Copy `analyses/_template.md`
2. Define: purpose, detection patterns, analysis logic, output format
3. Place in `analyses/your-analysis.md`
4. Update `workflows/onboard.md` to include the new analysis in the selection table
5. Submit a PR

**Requirements:**
- Clear detection patterns (what file patterns, naming conventions, markers to look for)
- Reporting thresholds (when to report vs skip)
- Output format (how findings become standards)

### New Agent Adapter (Medium barrier)

Add support for a new coding agent (e.g., Continue.dev, Windsurf, Codex).

1. Read `agents/adapter-spec.md` for the interface
2. Create `agents/{name}.js` implementing `detect()` and `transform()`
3. Test with `node bin/cli.js init` in a project with your agent's directory
4. Submit a PR

**Requirements:**
- `detect(projectPath)` returns true when the agent is present
- `transform(content)` returns an array of `{ path, content }` file descriptors
- Variable resolution: replace `$AGENT_RULES_DIR`, `$AGENT_CONFIG_FILE` in workflow content

### Content Improvements (Low barrier)

Fix, improve, or expand existing blueprints or analyses. Direct PR, no template needed.

## Code Style

- JavaScript files use `'use strict'` and CommonJS (`require`/`module.exports`)
- No external dependencies -- the CLI uses only Node.js built-in modules
- Keep it simple -- the CLI is a thin installer, not an application

## Testing

Before submitting a PR:

```bash
# Test the CLI
node bin/cli.js --version
node bin/cli.js help

# Test init with each agent
mkdir -p /tmp/test/.claude && cd /tmp/test && node /path/to/codeplaybook/bin/cli.js init
mkdir -p /tmp/test/.cursor && cd /tmp/test && node /path/to/codeplaybook/bin/cli.js init
mkdir -p /tmp/test/.github/instructions && cd /tmp/test && node /path/to/codeplaybook/bin/cli.js init
```

## Running CI Checks Locally

Run the same checks CI runs on pull requests:

```bash
# Basic CLI test
npm test

# Test all three adapters
mkdir -p /tmp/test-claude/.claude && cd /tmp/test-claude && node /path/to/codeplaybook/bin/cli.js init
mkdir -p /tmp/test-cursor/.cursor && cd /tmp/test-cursor && node /path/to/codeplaybook/bin/cli.js init
mkdir -p /tmp/test-copilot/.github/instructions && cd /tmp/test-copilot && node /path/to/codeplaybook/bin/cli.js init
```

Replace `/path/to/codeplaybook` with the path to your local clone.

## Pull Request Guidelines

- Keep PRs focused -- one blueprint, one analysis, or one agent per PR
- Include a clear description of what you're adding and why
- For blueprints: explain when the pattern is appropriate and when it isn't
- For analyses: explain what patterns it detects and how

## Questions?

Open an issue if you're unsure about anything. We're happy to help guide contributions.
