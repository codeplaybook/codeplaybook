# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.5] - 2026-05-02

### Added

- Audit dashboard (`npx codeplaybook dashboard`) — local web UI for tracking violations
- `audit-save` CLI command — persist audit results to SQLite (`.codeplaybook/audit.db`)
- Severity levels in standards (Critical/High/Medium/Low, defaults to Medium)
- Violation fingerprinting for cross-run tracking (detect new, fixed, recurring violations)
- Code context snapshots in audit reports (~4 lines above/below violation)
- Copy Fix Prompt — select violations in dashboard, copy formatted prompt for any AI agent
- Trend chart showing violation counts across audit runs

### Changed

- Audit workflow now saves results to SQLite automatically
- Audit report groups violations by severity

## [0.0.3] - 2026-05-01

### Fixed

- Add repository, homepage, and bugs links to package.json
- Make CLI executable

### Changed

- Improved README problem statement

## [0.0.2] - 2026-05-01

### Changed

- Improved README with stronger problem statement
- Set version to 0.0.1 for initial pre-release (published as 0.0.2)

## [0.0.1] - 2026-05-01

### Added

- Initial release
- CLI installer (`npx codeplaybook init`) with agent auto-detection
- Agent adapters: Claude Code, Cursor, GitHub Copilot
- 4 architectural blueprints: Hexagonal, Clean Architecture, Feature Slices, Frontend Component Architecture
- 6 codebase analyses: Code Scaffolding, Architecture Boundaries, Testing Practices, Dev Workflow, Error Handling, Import Patterns
- 3 workflows: Onboard (discover patterns), Prescribe (declare architecture), Sync (re-deploy)
- `.codeplaybook/` format specification for agent-agnostic standards
