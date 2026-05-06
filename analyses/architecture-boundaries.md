# Architecture Boundaries

Analyze what each file role (Controller, Service, UseCase, Repository, Handler) actually does in practice and surface files with mixed responsibilities or inconsistent naming.

## What to Look For

Every codebase develops implicit conventions for what each "role" means. This analysis makes those conventions explicit and flags violations.

### File Role Patterns (Authoritative List)

This analysis owns the canonical role-scanning patterns. Other analyses (e.g., code-scaffolding) may reference these patterns but should defer to this file for responsibility classification.

```
# Controllers (expected: HTTP/gRPC/presentation only)
*Controller.ts    *Controller.js    *controller.py
*_controller.rb   *Controller.java  *Controller.kt
*_controller.go   *Controller.go
*views.py         *viewsets.py      *_view.py         # Django
*Router.ts        *router.ts                          # Express/Fastify

# Handlers (expected: event/command processing)
*Handler.ts    *Handler.js    *handler.py
*_handler.rb   *Handler.java  *Handler.kt
*_handler.go   *Handler.go
*Listener.java    *Listener.kt                        # Spring events
*Consumer.ts      *consumer.py                        # Message queues

# Services (expected: business logic, orchestration)
*Service.ts    *Service.js    *service.py
*_service.rb   *Service.java  *Service.kt
*_service.go   *Service.go

# Use Cases (expected: single business operation)
*UseCase.ts    *UseCase.js    *Interactor.ts
*use_case.py   *_use_case.rb  *UseCase.java  *UseCase.kt

# Repositories (expected: data access abstraction)
*Repository.ts    *Repository.js    *Repo.ts
*repository.py    *_repository.rb   *Repository.java  *Repository.kt
*_repo.go         *Repository.go
*Dao.java         *Dao.kt                             # Java DAO pattern

# Managers (expected: ambiguous — investigate)
*Manager.ts    *Manager.js    *manager.py    *Manager.java

# Helpers/Utils (expected: stateless utility)
*Helper.ts    *Utils.ts    *helper.py    *_helper.rb
*Helper.java  *Utils.java  *util.go      *helpers.go

# Frontend — Components (expected: render UI, delegate logic to hooks/services)
*.component.tsx    *Component.tsx    *Component.vue    *.svelte
*.component.ts     *.component.html                    # Angular
page.tsx    layout.tsx    +page.svelte                  # Meta-framework pages

# Frontend — Hooks/Composables (expected: reusable stateful logic)
use*.ts    use*.tsx    use*.js
use*.composable.ts    use*.hook.ts

# Frontend — State/Store (expected: state management only)
*Slice.ts    *slice.ts    *Store.ts    *store.ts
*Reducer.ts    *Context.tsx    *Provider.tsx
*atom.ts    *.store.ts

# Frontend — API/Query layer (expected: data fetching abstraction)
*Api.ts    *api.ts    *Query.ts    *.queries.ts
*Loader.ts    *loader.ts
```

### Responsibility Indicators

Scan file contents for these patterns to classify what a file actually does:

```
# IO / Data Access (belongs in repositories/adapters)
.save(    .find(    .delete(    .update(           # ORMs (TypeORM, Mongoose, etc.)
fetch(    axios.    http.       database.
query(    .execute(
.objects.    .filter(    .all(    .get_queryset(   # Django ORM
Session.query(    db.session    session.query(     # SQLAlchemy
.findById(    .findOne(    .findAll(              # Sequelize/Prisma
db.Query(    db.Exec(    sql.Open(               # Go database
JpaRepository    CrudRepository    .findBy(       # Spring Data

# Business Logic (belongs in services/use cases)
validate    calculate    process
transform   apply

# HTTP / Presentation (belongs in controllers)
@Get(    @Post(    @Put(    @Delete(              # NestJS
@GetMapping(    @PostMapping(    @RequestMapping(  # Spring
@app.route(    @app.get(    @router.get(          # Flask/FastAPI
res.json(    res.send(    response.    request.
@Query(    @Body(    @Param(
http.ResponseWriter    http.Request            # Go stdlib
render(    redirect(    json_response(          # Django/Rails

# RPC / gRPC (belongs in controllers/handlers)
@GrpcMethod(    @GrpcService(    @GrpcStreamMethod(
@MessagePattern(    @EventPattern(
grpc.UnaryHandler    grpc.StreamHandler
pb.Register*Server(

# Event Handling (belongs in handlers)
@OnEvent(    @Subscribe(    @EventListener(
.handle(     .process(    eventEmitter
@Async    @Scheduled    @RabbitListener(    @KafkaListener(

# Frontend — UI Rendering (belongs in components)
return (    return <    render(    <template>
className=    style=    onClick=    onChange=

# Frontend — Data Fetching (belongs in hooks/API layer, not components)
fetch(    axios.    useQuery(    useSWR(    useMutation(
getServerSideProps    getStaticProps    loader(

# Frontend — State Logic (belongs in hooks/stores, not components)
useReducer(    dispatch(    createSlice(    defineStore(
createContext(    useContext(    setState(    zustand
```

### Mixed Responsibility Detection

These combinations are red flags:

```
# Controller doing business logic
Controller/View file containing: validate, calculate, process

# Service doing IO directly
Service file containing: .save(, .find(, fetch(, database., db.Query(, Session.query(

# Repository/Dao doing business logic
Repository/Dao file containing: validate, calculate, transform

# Handler doing presentation
Handler file containing: res.json(, response., http.ResponseWriter, render(

# Controller mixing transport types
Controller file containing both HTTP and gRPC decorators

# Component doing direct data fetching (should use hooks/API layer)
Component file containing: fetch(, axios., direct API URLs, db queries

# Component with complex business logic (should use hooks/services)
Component file containing: validate, calculate, transform, complex conditionals > 20 lines

# Hook doing UI rendering (should be in components)
Hook file containing: return <, return (, JSX, className=

# Store/slice doing data fetching (should be in API layer)
Store/Slice file containing: fetch(, axios., API URLs
```

## Analysis Method

1. **Enumerate files by role name**: Group by Controller/Service/UseCase/etc.
2. **Sample and analyze**: Read 3-5 files per role
3. **Classify actual responsibilities** per file:
   - Presentation: HTTP handling, request/response, UI rendering
   - Business logic: Validation, calculation, rules
   - Data access: Persistence, external API calls, data fetching
   - Orchestration: Coordinating other components
   - State management: Application/UI state (frontend)
4. **Compare name vs actual**: Does "Service" do service things?
5. **Find mixed responsibilities**: Single file doing multiple concerns
6. **Detect naming inconsistencies**: Same role with different names (e.g., UserService vs UserManager)

## Expected Responsibilities

| Role | Expected | Red Flags |
|------|----------|-----------|
| **Controller** | HTTP/gRPC handling, request mapping | Business logic, direct DB access |
| **Service** | Business logic, orchestration | HTTP/transport concerns, raw queries |
| **UseCase** | Single business operation | Multiple concerns, infrastructure |
| **Handler** | Event/command/message processing | HTTP responses, direct DB access |
| **Repository/Dao** | Data access abstraction | Business rules, validation |
| **Manager** | Ambiguous — investigate | Often a code smell |
| **Component** | Render UI, handle user interaction | Direct API calls, complex business logic, raw state management |
| **Hook/Composable** | Reusable stateful logic | UI rendering, direct API calls without abstraction |
| **Store/Slice** | State management | Data fetching, UI concerns, business validation |
| **API/Query layer** | Data fetching abstraction | UI rendering, business logic, state management |

## Drift Categories

| Drift Type | Example | Impact |
|------------|---------|--------|
| **Bloated controller** | Controller with business logic | Hard to test, tightly coupled |
| **Anemic service** | Service that just delegates | Unnecessary indirection |
| **Fat repository** | Repo with business rules | Logic in wrong layer |
| **Confused handler** | Handler doing everything | Unclear boundaries |
| **God manager** | Manager with all concerns | Unmaintainable |
| **God component** | Component with fetch + logic + state | Untestable, can't reuse parts |
| **Leaky hook** | Hook that renders UI | Breaks hook contract |
| **Fat store** | Store doing fetching + validation | Store becomes a second backend |

## Reporting Threshold

Report only if:
- ≥3 files with the same role name AND
- (Inconsistent responsibilities across files OR mixed concerns detected within files)

## Insight Template

```
INSIGHT:
  id: ARCH-[n]
  title: "ARCHITECTURE: [role] has inconsistent boundaries"
  summary: "[role] files show [N] different responsibility patterns."
  confidence: [high|medium|low]
  evidence:
    role_analysis:
      - role: "[RoleName]"
        expected: "[expected responsibility]"
        actual_patterns:
          - "[responsibility]" — [N] files
          - "[other responsibility]" — [N] files (drift)
    mixed_responsibility_hotspots:
      - path[:line] — [role] doing [unexpected concern]
    naming_inconsistencies:
      - "[NameA] vs [NameB]" — same responsibility, different name
```

## Output Suggestions

### Standard: Responsibility Boundaries

- "Controllers handle HTTP only; delegate business logic to services or use cases"
- "Services contain business logic; do not access databases or external APIs directly"
- "Repositories abstract data access only; do not contain business rules or validation"

