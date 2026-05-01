# Creating Analyses

An analysis defines how to detect a specific type of pattern in a codebase and what standards/commands to generate from the findings.

## Quick start

1. Copy `analyses/_template.md` to `analyses/your-analysis.md`
2. Fill in all sections
3. Update `workflows/onboard.md` to include your analysis in the selection table
4. Submit a PR

## Structure

Every analysis needs these sections:

### Purpose

What the analysis detects and why it matters.

### Detection Patterns

Define what to look for:
- **File patterns**: Which files to scan (glob patterns)
- **Markers**: What code patterns indicate the thing you're looking for
- **Role classification**: How to categorize files for comparison

### Analysis Logic

Define how to analyze:
- **What to check**: Step-by-step analysis instructions
- **Reporting thresholds**: When to report vs skip (avoid noise)
- **Classification**: High/medium/low confidence for each finding

### Output Format

Define what to generate:
- **Standards**: Template for standards the analysis should produce
- **Commands**: Template for commands (if applicable)

## Tips

- Set clear reporting thresholds -- too many false positives make the tool noisy
- Detection patterns should work across multiple frameworks
- Include evidence requirements -- every finding needs file paths
- Test against real codebases to validate thresholds

## Adding to the onboard workflow

After creating your analysis file, update `workflows/onboard.md`:

1. Add a row to the analysis selection table in Step 5a
2. Add a row to the reference file mapping table in Step 5b
3. Set a recommendation rule (when to recommend, when to skip)
