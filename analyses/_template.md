# {Analysis Name}

## Purpose

{What this analysis detects and why it matters. What problem does it help solve?}

## Detection Patterns

### File patterns to scan

- {Glob pattern or directory to check, e.g., `src/**/*.ts`}
- {Another pattern}

### Markers to look for

| Marker | Indicates | Example |
|--------|-----------|---------|
| {Pattern name} | {What it suggests} | {Code example or file path} |
| {Pattern name} | {What it suggests} | {Code example} |

### Role classification

{How to classify files into categories for this analysis. Define what each role means.}

| Role | File patterns | Responsibility |
|------|---------------|---------------|
| {Role 1} | `*Controller*`, `*Handler*` | {What this role should do} |
| {Role 2} | `*Service*`, `*UseCase*` | {What this role should do} |

## Analysis Logic

### What to check

1. {First thing to analyze -- e.g., "For each file matching role X, check if it contains markers of responsibility Y"}
2. {Second thing to analyze}
3. {Third thing}

### Reporting thresholds

Only report findings when:
- {Minimum threshold, e.g., "At least 3 files exhibit the same inconsistency"}
- {Another threshold}

### Classification

Classify each finding:
- **high confidence**: {When to classify as high}
- **medium confidence**: {When to classify as medium}
- **low confidence**: {When to classify as low -- these may be skipped in output}

## Output Format

### Standards to generate

For each finding above the reporting threshold:

```markdown
# {Suggested Standard Name}

{Description based on the finding}

## Scope

{Derived from the files where the pattern was found}

## Rules

* {Rule derived from the consistent pattern}
* {Rule to prevent the inconsistency}
```

### Commands to generate

{If this analysis should also generate commands, describe them:}

```markdown
# {Suggested Command Name}

{What the command helps do}

## Steps

### 1. {Step}
{Instructions}
```

{If this analysis only generates standards (no commands), write: "This analysis generates standards only."}
