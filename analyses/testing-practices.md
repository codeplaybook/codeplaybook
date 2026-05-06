# Testing Practices

Analyze the codebase's testing patterns across three dimensions: test coverage, test data construction, and test file structure. Propose standards for consistency.

## Part 1: Test Coverage

### What to Look For

Check whether source files have corresponding test files. This reveals the team's testing expectations and any coverage gaps.

### Source-to-Test Mapping Conventions

```
# Colocated tests (same directory)
src/foo.ts          -> src/foo.spec.ts
src/foo.ts          -> src/foo.test.ts
src/foo.service.ts  -> src/foo.service.spec.ts

# Separate test directory
src/foo.ts          -> test/foo.spec.ts
src/services/bar.ts -> test/services/bar.spec.ts

# Go convention
pkg/foo.go          -> pkg/foo_test.go

# Python conventions
src/foo.py          -> tests/test_foo.py
src/foo.py          -> tests/foo_test.py

# Java/Kotlin
src/main/.../Foo.java -> src/test/.../FooTest.java

# Ruby
lib/foo.rb          -> spec/foo_spec.rb
```

### Analysis Method

1. Detect the test naming convention by scanning for existing test files
2. Identify the convention: `.spec.ts` vs `.test.ts` vs `_test.go` vs `test_*.py`
3. Identify the placement: colocated vs separate `test/` directory
4. For each source file in key directories (services, controllers, use cases, etc.), check if a matching test file exists
5. Calculate the coverage ratio

### Reporting Threshold

Report if:
- ≥30% of source files in a role category (services, controllers, etc.) lack corresponding test files, OR
- A clear convention exists but is followed inconsistently

### Insight Template

```
INSIGHT:
  id: COVERAGE-[n]
  title: "TEST COVERAGE: [X]% of [role] files have corresponding tests"
  summary: "[N] out of [M] [role] files have test files. Convention: [convention]."
  confidence: [high|medium|low]
  evidence:
    convention: "[.spec.ts | .test.ts | _test.go | etc.]"
    placement: "[colocated | separate test/ dir]"
    covered:
      - path — has test at [test-path]
    uncovered:
      - path — no test file found
```

---

## Part 2: Test Data Construction

### What to Look For

Determine how tests build their input data: shared helpers/builders, inline literals, fixture files, or a mix. Inconsistency here makes tests harder to maintain and creates subtle bugs.

### Helper/Builder Patterns

```
# Factory functions
*Factory*    factory(    createMock    buildMock
make(        build(      generate(     fake(    stub(

# Builder patterns
*Builder*    .build()    .create()    .with(    .having(

# Test data libraries
faker    Faker    @faker-js    factory-girl    fishery
test-data-bot    FactoryBot    factory_bot    Fabricator
```

### Fixture/Seed Patterns

```
# Fixture directories
fixtures/    __fixtures__/    seeds/    mocks/    stubs/

# Fixture loading
loadFixture    readFixture    importFixture    fixture(    seed(
```

### Inline Construction Indicators

```
# Direct object creation in test bodies
const mock = {
let testData = {
const input = {
new TestEntity(
Object.assign(
{ ...baseData,
```

### Analysis Method

1. List test files, sort by path, sample first 10 (or all if <10)
2. For each file, classify the primary data construction method
3. Detect shared builders: same helper imported in ≥3 test files
4. Check for a dedicated mock/factory directory (`test/__mocks__/`, `test/utils/`, `test/factories/`)

### Classification Criteria

| Pattern | Indicators |
|---------|------------|
| **Helpers/builders** | Dedicated factory functions reused across ≥3 test files |
| **Inline** | Objects created directly in test bodies; no shared helpers |
| **Fixtures** | External JSON/YAML files or fixture directories |
| **Mixed** | Multiple patterns without a dominant approach |

### Reporting Threshold

Report if:
- ≥2 data construction patterns appear in the sample, OR
- Shared builders exist but many tests still use inline construction

### Insight Template

```
INSIGHT:
  id: TESTDATA-[n]
  title: "TEST DATA: construction patterns vary ([X]% helpers, [Y]% inline, [Z]% fixtures)"
  summary: "Test data is constructed using [dominant pattern]. [inconsistencies if any]."
  confidence: [high|medium|low]
  evidence:
    shared_helpers:
      - path — imported in [N] test files
    inline_examples:
      - path[:line-line] — uses inline construction
    fixture_dirs:
      - path — contains [N] fixture files
```

---

## Part 3: Test File Structure

### What to Look For

Determine the common structure of test files: what they import, how they organize describe/it blocks, what setup/teardown they use, and what assertion style they prefer.

### Structure Elements to Extract

```
# Test framework
describe(    it(    test(    expect(
@Test    @Before    @After    @BeforeEach
def test_    class Test

# Setup/teardown
beforeAll(    afterAll(    beforeEach(    afterEach(
@BeforeAll   @AfterAll    setUp(         tearDown(

# Assertion style
expect().toBe()          # Jest/Vitest
assert.equal()           # Node assert
should.equal()           # Chai
assertThat()             # Java/Kotlin
assert                   # Go/Python

# Mocking
jest.mock(    jest.spyOn(    jest.fn()
unittest.mock    @Mock    @InjectMocks
mock.Mock    gomock    mockery

# Common imports in test files
import { ... } from 'test/__mocks__/'
import { ... } from 'test/utils/'
import { ... } from '@testing-library/'
```

### Analysis Method

1. Sample 3-5 test files from different parts of the codebase
2. For each file, extract:
   - Framework imports (Jest, Vitest, pytest, JUnit, etc.)
   - Shared utility imports (mock helpers, test factories, custom matchers)
   - Describe/it nesting structure (flat vs nested)
   - Setup and teardown patterns
   - Assertion style
   - Mocking approach
3. Identify the dominant patterns across the sample
4. Note any shared test utilities directories

### Reporting Threshold

Report if:
- ≥3 test files share a consistent structure (same imports, same patterns)

### Insight Template

```
INSIGHT:
  id: TESTSTRUCT-[n]
  title: "TEST STRUCTURE: tests follow [framework] with [pattern] organization"
  summary: "Test files consistently use [framework], [assertion style], [mocking approach]."
  confidence: [high|medium|low]
  evidence:
    framework: "[Jest | Vitest | pytest | JUnit | Go testing | etc.]"
    shared_imports:
      - "[import path]" — used in [N] test files
    structure_pattern:
      - describe_nesting: "[flat | nested by feature]"
      - setup: "[beforeEach | setUp | etc.]"
      - assertion: "[expect/toBe | assert | should | etc.]"
      - mocking: "[jest.mock | unittest.mock | @Mock | etc.]"
    utility_dirs:
      - path — contains [description]
```

---

## Output Suggestions

### Standard: Test Requirements

- "Write unit tests for all new classes, services, and modules"
- "Follow the `[convention]` naming pattern for test files (e.g., `*.spec.ts`)"
- "Place test files [colocated with source | in test/ directory] matching the existing convention"

### Standard: Test Data Consistency

- "Use shared mock helpers from `[path]` instead of defining inline mock objects"
- "When a shared mock does not exist for a common entity, create one in `[mock directory]`"
- "Use `[typed mock pattern]` for service mocks; avoid `as any` casts"

