# Audit Workflow

Scan the codebase against existing `.codeplaybook/standards/` and report violations. Optionally fix them with user confirmation. Persists results to SQLite for tracking over time.

## Overview

This workflow checks whether your code actually follows the standards you've defined. It reads each standard's scope, severity, and rules, scans matching files for violations, presents a report grouped by severity, saves results to a local database, and optionally fixes violations.

This workflow is agent-agnostic. It reads standards directly from `.codeplaybook/standards/` (the source of truth) and operates on source files.

## Guarantees

- **Read-only scan.** The audit phase only reads files — no modifications until the user explicitly approves fixes.
- **Evidence required.** Every violation must include the file path, line number, and a brief description of what was found.
- **Context captured.** Each violation includes ~4 lines of code above and below the violation line for context.
- **Fix with confirmation.** Each proposed fix is shown as a diff and requires user approval before applying.
- **Non-destructive.** Fixes modify only the specific code that violates a rule — surrounding code is untouched.
- **Persistent history.** Results are saved to `~/.codeplaybook/audit.db` (user-level) for tracking progress across all projects.

---

## Step 0 — Introduction

Print exactly:

```
I'll audit your codebase against the standards defined in .codeplaybook/standards/.
```

---

## Step 1 — Load Standards

Read all standard files from `.codeplaybook/standards/*.md`.

For each file, parse:
- **Name**: The H1 heading (`# {Name}`)
- **Severity**: The content under `## Severity` — if absent, default to `Medium`. Valid values: `Critical`, `High`, `Medium`, `Low`.
- **Scope**: The content under `## Scope` — this determines which files to scan
- **Rules**: The bullet points under `## Rules` — these are what we check for

If no standard files found, print:

```
No standards found in .codeplaybook/standards/.
Run /codeplaybook-onboard or /codeplaybook-prescribe first to generate standards.
```

Exit the workflow.

Otherwise, print:

```
Loaded [N] standards from .codeplaybook/standards/:
  - [Name 1] ([severity], scope: [scope summary])
  - [Name 2] ([severity], scope: [scope summary])
  ...
```

---

## Step 2 — Scan Codebase

For each loaded standard:

### 2a — Resolve scope to files

Convert the `## Scope` section into file glob patterns:
- "TypeScript files" → `**/*.ts`
- "React components" → `**/*.tsx`
- "All test files" → `**/*.{test,spec}.{ts,js,tsx,jsx}`
- "Python files in src/" → `src/**/*.py`
- If scope is broad or unclear → scan `src/**/*` or the project root

Find all matching files. Skip `node_modules/`, `dist/`, `build/`, `.git/`, and other common build artifacts.

### 2b — Check each rule

For each rule in the standard:

1. Read each file in scope
2. Look for patterns that violate the rule. Use the rule text as guidance for what constitutes a violation. Examples:
   - "Controllers must not contain business logic" → look for database queries, complex calculations, or data transformation in controller files
   - "Do not swallow errors with empty catch blocks" → look for `catch` blocks with empty bodies or only comments
   - "Services must not import from infrastructure" → check import statements for infrastructure module references
   - "Use intersection types for DTO enrichment" → look for DTOs that manually redeclare domain fields instead of using `&`
3. For each violation found, assign a sequential number (`[1]`, `[2]`, ...) across all standards and record:
   - `number`: sequential violation number (used for "Fix selected" in Step 4)
   - `file`: the file path relative to project root (must be a file, not a directory)
   - `line`: the exact line number where the violation starts (not just `1` — find the actual line)
   - `end_line`: the line number where the violation ends (same as `line` if single-line)
   - `standard_name`: the name of the standard being checked
   - `standard_slug`: the filename slug of the standard (e.g., `codeplaybook-feature-isolation`)
   - `severity`: the severity from the standard (`Critical`, `High`, `Medium`, or `Low`)
   - `rule`: the rule text that was violated
   - `evidence`: a brief description of what was found (e.g., "Database query `db.query(...)` in controller method `createUser`")
   - `suggested_fix`: a brief description of how to fix it (e.g., "Move query to UserRepository")

   **Do NOT include code snippets or a `context` field.** The CLI automatically reads the source file and captures ±4 lines around the violation line when saving to the database.

### 2c — Skip compliant files

If a file in scope has no violations, skip it silently. Only report files with actual violations.

---

## Step 3 — Present Report

If no violations found across all standards, print:

```
============================================================
  AUDIT COMPLETE — ALL CLEAR
============================================================

Scanned [N] files against [M] standards.
No violations found. Your codebase follows the defined standards.
============================================================
```

Exit the workflow.

If violations were found, group by severity and print:

```
============================================================
  AUDIT REPORT
============================================================

CRITICAL ([count]):

  [1] [file]:[line]
      Standard: [Standard Name]
      Rule: "[rule text]"
      Found: [evidence description]
      Fix: [suggested fix]

HIGH ([count]):

  [2] [file]:[line]
      Standard: [Standard Name]
      Rule: "[rule text]"
      Found: [evidence description]
      Fix: [suggested fix]

MEDIUM ([count]):

  [3] [file]:[line]
      Standard: [Standard Name]
      Rule: "[rule text]"
      Found: [evidence description]
      Fix: [suggested fix]

LOW ([count]):

  ...

------------------------------------------------------------
Summary: [total] violations ([critical] critical, [high] high,
         [medium] medium, [low] low) across [N] standards
============================================================
```

Omit severity groups that have zero violations.

---

## Step 3.5 — Save to Audit History

After presenting the report, silently save the results to the audit database:

**Every violation MUST include ALL required fields.** The `audit-save` command will reject the data if any required field is missing:

| Field | Required | Description |
|-------|----------|-------------|
| `file` | Yes | File path relative to project root |
| `line` | Yes | Line number where violation starts |
| `end_line` | No | Line number where violation ends (defaults to `line`) |
| `standard_name` | Yes | Name of the standard |
| `standard_slug` | Yes | Filename slug of the standard |
| `severity` | Yes | `Critical`, `High`, `Medium`, or `Low` |
| `rule` | Yes | The rule text that was violated |
| `evidence` | Yes | What was found |
| `suggested_fix` | No | How to fix it |
| `context` | Auto | **Do not provide.** The CLI reads the actual file and captures ±4 lines around the violation automatically. |

1. Write the violations as JSON to `.codeplaybook/audit-results.json`:

```json
{
  "standards_checked": 5,
  "violations": [
    {
      "file": "src/controllers/user.ts",
      "line": 42,
      "end_line": 43,
      "standard_name": "Architecture Boundaries",
      "standard_slug": "codeplaybook-architecture-boundaries",
      "severity": "High",
      "rule": "Controllers must not contain business logic",
      "evidence": "Database query db.query(...) in controller method createUser",
      "suggested_fix": "Move query to UserRepository"
    }
  ]
}
```

2. Run the CLI command to save:

```bash
codeplaybook audit-save --file .codeplaybook/audit-results.json
```

3. Delete the temporary JSON file after successful save.

This step requires no user interaction. If the save fails, print a warning but continue to Step 4.

After saving, print:

```
Audit results saved. View the full dashboard with:
  npx codeplaybook dashboard
  → http://localhost:4200
```

---

## Step 4 — Ask User

After presenting the report, ask via AskUserQuestion with options:

- **Fix all** — Propose fixes for every violation, one at a time, with confirmation
- **Fix selected** — Let user pick which violations to address
- **Export report** — Save the report to `.codeplaybook/audit-report.md`
- **Dismiss** — Exit without taking action

### If "Fix all"

Proceed to Step 5 with all violations.

### If "Export report"

Write the audit report to `.codeplaybook/audit-report.md` with the same format as shown in Step 3, plus a timestamp at the top:

```markdown
# Audit Report

Generated: [date and time]

[full report content]
```

Print:

```
Report saved to .codeplaybook/audit-report.md

View results interactively with:
  npx codeplaybook dashboard
  → http://localhost:4200
```

Exit the workflow.

### If "Dismiss"

Print:

```
Audit complete. No changes made.
```

Exit the workflow.

### If "Fix selected"

Present the violations as a numbered list and ask the user which ones to fix (e.g., "1, 3, 5" or "all").

Proceed to Step 5 with only the selected violations.

---

## Step 5 — Apply Fixes

For each violation to fix:

### 5a — Read the file

Read the full file containing the violation.

### 5b — Propose a refactoring

Based on the rule that was violated:
- Determine the minimal change needed to make the code comply
- Generate the proposed change
- Show the user a before/after diff:

```
Fix [current]/[total]: [file]:[line]
Rule: "[rule text]"

BEFORE:
  [relevant code snippet showing the violation]

AFTER:
  [proposed refactored code]

Apply this fix? (yes / skip / stop)
```

### 5c — Ask for confirmation

Ask via AskUserQuestion with options:
- **Yes** — Apply the change
- **Skip** — Move to next violation without changing this file
- **Stop** — Stop fixing, keep remaining violations unfixed

### 5d — Apply or skip

If "Yes":
- Apply the edit to the file
- Record as fixed

If "Skip":
- Move to the next violation

If "Stop":
- Exit the fix loop

---

## Step 6 — Summary

After all fixes are attempted (or stopped), print:

```
============================================================
  AUDIT FIX SUMMARY
============================================================

Fixed: [X] of [Y] violations
Skipped: [Z] violations
Remaining: [R] violations

Files modified:
  - [file1]
  - [file2]
============================================================
```

If remaining violations > 0, additionally print:

```
Run /codeplaybook-audit again to check remaining violations.
```

---

## Edge Cases

### Standard with no rules

If a standard file has a `## Scope` section but no `## Rules` section (or empty rules), skip it and print:

```
Skipping "[Standard Name]" — no rules defined.
```

### Standard with very broad scope

If a standard's scope matches more than 500 files, print a warning:

```
Standard "[Name]" matches [N] files. Scanning may take a moment...
```

Proceed normally.

### Fix conflicts with other violations

If fixing one violation would affect code near another violation in the same file, handle them sequentially — fix one, re-read the file, then attempt the next fix on the updated content.

### Not a git repository

Unlike onboard/prescribe, audit does NOT require a git repository. It works on any directory with `.codeplaybook/standards/`.

### audit-save fails

If the `codeplaybook audit-save` command fails (e.g., `better-sqlite3` not available), print a warning:

```
Warning: Could not save audit results to database. Install dependencies with npm install in the codeplaybook package directory.
```

Continue to Step 4 — the audit report is still displayed, just not persisted.
