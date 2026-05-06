# Creating Blueprints

A blueprint defines an architectural pattern with standards and framework-specific variants.

## Quick start

1. Copy `blueprints/_template.md` to `blueprints/your-pattern.md`
2. Fill in all sections
3. Test by running `npx codeplaybook init` and then `/codeplaybook-onboard` (select "Start with a blueprint")
4. Submit a PR

## Structure

Every blueprint needs these sections:

### Header

```markdown
# {Pattern Name}

{Brief description of what the pattern is and the problem it solves.}

## When to Use
- {Scenario 1}
- {Scenario 2}

## When NOT to Use
- {Anti-scenario}
```

### Standards

At least 2 standards. Each standard becomes a file in `.codeplaybook/standards/`.

```markdown
### Standard: {Name}

{What it enforces and why.}

#### Scope
{Where it applies -- file types, directories, layers.}

#### Rules
* {Imperative rule, max ~25 words}
* {Another rule}
```

### Framework Variants

At least 2 frameworks. Each variant provides concrete directory mappings and naming conventions.

```markdown
### NestJS

**Directory mapping:**
(show the actual directory tree)

**Naming conventions:**
(file and class naming patterns)

**Additional rules:**
(framework-specific decorators, annotations, DI patterns)
```

## Tips

- Keep rules concrete and actionable ("Do X" or "Never Y")
- Framework variants should map abstract concepts to concrete paths
- Include both backend and frontend frameworks when the pattern applies to both
- Reference the template at `blueprints/_template.md` for the full structure
