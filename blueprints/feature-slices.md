# Feature Slices (Vertical Architecture)

Organizes code **by feature** instead of by technical layer. Each feature (users, orders, payments) is a self-contained vertical slice with its own controller, service, repository, DTOs, and tests. Features communicate through a shared kernel, never by importing each other directly.

Key principles:
- **Feature independence**: Each feature can be understood, tested, and modified in isolation
- **Shared kernel**: Cross-cutting concerns (auth, logging, base classes) live in a shared directory
- **No cross-feature imports**: Features never import from each other — use events or the shared kernel

## When to Use

- Features evolve at different speeds and teams own specific features end-to-end
- The codebase is large enough that layer-based organization creates navigation overhead
- You want to add or remove features without touching unrelated code
- The system is a candidate for future decomposition into microservices along feature boundaries

## Start Simpler If

- Your app has only 1-2 features — a flat structure works until you add more
- Most logic is genuinely shared across features, making isolation artificial — consider hexagonal or clean architecture instead

---

## Standards

### Standard: Feature Isolation

#### Severity
High

#### Scope
All source files in feature directories

#### Rules
* Each feature lives in its own directory containing all related files (controller, service, repository, DTOs, tests)
* Features must never import directly from other feature directories
* Cross-feature communication must go through the shared kernel, events, or a dedicated integration layer
* Adding a new feature must not require modifying any existing feature's code
* Deleting a feature directory should not break any other feature (except shared kernel consumers)

### Standard: Shared Kernel

#### Severity
Medium

#### Scope
All source files

#### Rules
* Place cross-cutting concerns in the shared directory only: base classes, common types, utilities, guards, decorators
* The shared directory must not import from any feature directory
* Keep the shared directory minimal — if a type is used by only one feature, it belongs in that feature
* Database entities used by multiple features may live in shared, but prefer feature-owned entities when possible
* Shared modules must be backward-compatible — changes should not break existing feature consumers

### Standard: Feature Directory Structure

#### Severity
Medium

#### Scope
All feature directories

#### Rules
* Every feature directory must contain at minimum: a controller (or handler), a service, and a test file
* Place DTOs, interfaces, and types used only by this feature inside the feature directory
* Name the feature directory using the plural domain noun (e.g., `users/`, `orders/`, `payments/`)
* Tests for a feature live inside the feature directory (colocated), not in a separate test tree
* Feature-specific database entities or models belong inside the feature directory

## Framework Variants

### NestJS
Directory mapping:
- Features root: `src/features/` or `src/modules/`
- Shared kernel: `src/shared/`
- Each feature: `src/features/{name}/`

Feature directory structure:
```
src/features/{name}/
  {name}.controller.ts
  {name}.service.ts
  {name}.repository.ts
  {name}.module.ts
  dto/
    create-{name}.dto.ts
    update-{name}.dto.ts
    {name}-response.dto.ts
  entities/
    {name}.entity.ts
  {name}.service.spec.ts
```

Additional rules:
* Each feature has its own `@Module()` that declares its controller and provides its service and repository
* Feature modules are imported into the root `AppModule`
* Use NestJS `EventEmitter2` or a message broker for cross-feature communication
* Shared guards, interceptors, and pipes live in `src/shared/`

### Spring Boot
Directory mapping:
- Features root: `src/main/java/.../features/`
- Shared kernel: `src/main/java/.../shared/`

Feature directory structure:
```
features/{name}/
  {Name}Controller.java
  {Name}Service.java
  {Name}Repository.java
  dto/
    Create{Name}Request.java
    {Name}Response.java
  {Name}.java  (entity)
```

Additional rules:
* Each feature package contains all related classes
* Use Spring `@EventListener` or `ApplicationEventPublisher` for cross-feature communication
* Shared configuration and base classes in the shared package
* JPA entities are feature-scoped when possible

### FastAPI
Directory mapping:
- Features root: `src/features/`
- Shared kernel: `src/shared/`

Feature directory structure:
```
features/{name}/
  router.py
  service.py
  repository.py
  schemas.py     (Pydantic DTOs)
  models.py      (SQLAlchemy/ORM models)
  tests/
    test_service.py
```

Additional rules:
* Each feature has its own FastAPI `APIRouter` included in the main app
* Use Pydantic models for DTOs (schemas.py)
* SQLAlchemy models are feature-scoped
* Cross-feature communication through Python events or shared service interfaces

### Express
Directory mapping:
- Features root: `src/features/`
- Shared kernel: `src/shared/`

Feature directory structure:
```
features/{name}/
  {name}.routes.ts
  {name}.controller.ts
  {name}.service.ts
  {name}.repository.ts
  {name}.dto.ts
  {name}.model.ts
  {name}.test.ts
```

Additional rules:
* Each feature exports a router that is mounted on the Express app
* Use an event emitter pattern for cross-feature communication
* Shared middleware and utilities in `src/shared/`

### Go
Directory mapping:
- Features root: `internal/features/`
- Shared kernel: `internal/shared/`

Feature directory structure:
```
internal/features/{name}/
  handler.go
  service.go
  repository.go
  dto.go
  model.go
  service_test.go
```

Additional rules:
* Each feature is a Go package — natural isolation via package boundaries
* Cross-feature communication through interfaces defined in shared or through channels
* HTTP handlers register routes in `cmd/` or a central router setup
* Keep `internal/` for all feature packages to prevent external imports

### Next.js (App Router)
Directory mapping:
- Features root: `src/features/` (business logic) + `app/` (routes)
- Shared kernel: `src/shared/`

Feature directory structure:
```
src/features/{name}/
  components/
    {Name}List.tsx
    {Name}Card.tsx
    {Name}Form.tsx
  hooks/
    use{Name}.ts
    use{Name}Mutations.ts
  api/
    {name}.api.ts
  types/
    {name}.types.ts
  {name}.test.tsx

app/{name}/         (route pages)
  page.tsx
  [id]/
    page.tsx
```

Additional rules:
* Feature components, hooks, and API calls live in `src/features/{name}/`
* Route pages in `app/` import from features — pages are thin wrappers
* Shared UI components (Button, Modal, Layout) live in `src/shared/components/`
* Cross-feature data flows through shared state or server-side data fetching
