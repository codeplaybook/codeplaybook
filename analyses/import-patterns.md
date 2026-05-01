# Import & Module Patterns

Analyze how files import dependencies and organize module boundaries. Surface inconsistencies in import ordering, barrel file usage, and path aliasing.

## What to Look For

Import conventions affect readability, build performance, and dependency tracking. This analysis identifies the dominant patterns and flags deviations.

### Import Ordering Conventions

```
# Common ordering (check which the codebase uses)

# Style A: External → Internal → Relative
import React from 'react'           # 1. External/node_modules
import { UserService } from '@/services'  # 2. Internal (aliased)
import { helper } from './utils'     # 3. Relative (same module)

# Style B: By type
import type { User } from '...'     # 1. Type imports
import { injectable } from 'tsyringe' # 2. Framework
import { UserService } from '...'    # 3. Application
import { helper } from '...'         # 4. Utilities

# Style C: Alphabetical (no grouping)
# All imports sorted alphabetically regardless of source
```

### Import Ordering Indicators

```
# Enforced ordering (tooling present)
eslint-plugin-import    eslint-plugin-simple-import-sort
isort                   isort.cfg               # Python
goimports                                       # Go

# Separator lines between groups
(blank line between import groups)
```

### Barrel Files / Index Re-exports

```
# Barrel file patterns
index.ts    index.js    __init__.py    mod.rs

# Re-export styles
export { * } from './'
export { UserService } from './user.service'
export * from './types'
module.exports = { ...require('./*') }

# Python __init__.py
from .user_service import UserService
from .types import *
```

### Path Aliases

```
# TypeScript/JavaScript aliases (tsconfig.json paths or package.json imports)
@/*         @app/*      @domain/*     @infra/*
~/          #/          src/

# Python relative vs absolute
from myapp.services import ...      # absolute
from .services import ...           # relative
from ..models import ...            # parent relative

# Go package paths
internal/   pkg/        cmd/
```

### Circular Dependency Indicators

```
# Tools that detect circulars
madge       dpdm        circular-dependency-plugin
eslint-plugin-import/no-cycle

# Symptoms (heuristic — not definitive)
# Same two modules importing each other
# Barrel file importing from a file that imports the barrel
```

## Analysis Method

1. **Sample imports**: Read the import section of 8-10 files across different modules
2. **Classify ordering**: Determine if imports follow external→internal→relative, type-based, alphabetical, or no pattern
3. **Check for enforcement**: Look for eslint-plugin-import, isort, goimports in config
4. **Detect barrel files**: Count `index.ts`/`__init__.py` files. Check if they're used consistently across all modules or only some
5. **Check path aliases**: Look at tsconfig.json paths, package.json imports field. Note which aliases exist and whether they're used consistently
6. **Spot circular risk**: Check if circular dependency tooling is configured

## Reporting Threshold

Report if:
- Import ordering is inconsistent across ≥3 files (some group, some don't), OR
- Barrel files exist in some modules but not others (≥3 modules with, ≥3 without), OR
- Path aliases are defined but not used consistently

## Insight Template

```
INSIGHT:
  id: IMPORTS-[n]
  title: "IMPORTS: [description of inconsistency]"
  summary: "Import ordering follows [pattern] in [N] files but differs in [M]. [barrel/alias findings]."
  confidence: [high|medium|low]
  evidence:
    ordering_pattern:
      - style: "[external-internal-relative | type-based | alphabetical | none]"
        files:
          - path[:line-line] — uses [style]
    barrel_files:
      - modules_with: [list of dirs with index.ts]
      - modules_without: [list of dirs missing index.ts]
    path_aliases:
      - alias: "[@ | ~ | #]"
        defined_in: path
        usage_count: [N] files
    enforcement_tools:
      - "[eslint-plugin-import | isort | goimports | none]"
```

## Output Suggestions

### Standard: Import Conventions

- "Order imports: external packages, then internal aliases, then relative paths. Separate each group with a blank line"
- "Use path alias `[alias]` for cross-module imports; use relative paths only within the same module"
- "Every public module directory must have a barrel file (`index.ts` / `__init__.py`) that exports its public API"
- "Do not import from a barrel file within the same module — use direct relative imports"
