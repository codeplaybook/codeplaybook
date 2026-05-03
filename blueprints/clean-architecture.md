# Clean Architecture

Organizes code in concentric layers with a strict **dependency rule**: source code dependencies always point inward. Inner layers know nothing about outer layers. This makes the core business logic framework-independent, database-independent, and testable without any infrastructure.

Four layers (inside → outside):
- **Entities**: Enterprise business rules, domain objects, core types
- **Use Cases**: Application-specific business rules, orchestrate entities
- **Interface Adapters**: Convert data between use case format and external format (controllers, presenters, gateways)
- **Frameworks & Drivers**: External tools and delivery mechanisms (web framework, database, UI)

## When to Use

- The application has complex business rules that must remain framework-independent and testable in isolation
- You need the core logic to survive framework migrations (e.g., switching from Express to Fastify, or Django to FastAPI)
- Multiple delivery mechanisms serve the same use cases (REST API, GraphQL, CLI, message consumer)
- Long-lived enterprise systems where protecting the domain from infrastructure churn is critical

## Start Simpler If

- Your app is a thin API that mostly proxies data with little business logic — a two-layer structure may be enough initially
- The application is dominated by infrastructure concerns (ETL pipelines, data importers) where the domain layer would be nearly empty

---

## Standards

### Standard: Clean Architecture Dependency Rule

#### Severity
High

#### Scope
All backend source files

#### Rules
* Dependencies point inward only — inner layers must never import from outer layers
* Entities layer has zero dependencies on any other layer
* Use Cases layer depends only on Entities
* Interface Adapters depend on Use Cases and Entities — never on Frameworks
* Frameworks & Drivers depend on Interface Adapters — this is the only layer that knows about external tools
* Cross layer boundaries using interfaces (dependency inversion) — outer layers implement interfaces defined by inner layers

### Standard: Clean Architecture Layer Structure

#### Severity
Medium

#### Scope
All backend source files

#### Rules
* Place enterprise entities and core business types in the entities layer directory
* Place application use cases in the use cases layer directory — one class per use case
* Place controllers, presenters, and gateways in the interface adapters layer directory
* Place framework configuration, database setup, and external tool integration in the frameworks layer directory
* Each use case must define its own input and output data structures (request/response models) — do not pass framework objects (HTTP request, ORM models) across layer boundaries

### Standard: Use Case Isolation

#### Severity
Medium

#### Scope
All backend source files in the use cases layer

#### Rules
* Each use case is a single class with one public method (execute, handle, or run)
* Use cases accept a typed input DTO and return a typed output DTO
* Use cases interact with external systems only through gateway interfaces defined in the use case layer
* Use cases must not contain infrastructure concerns (SQL, HTTP, file I/O)
* Use cases are independently testable by mocking gateway interfaces

## Commands

### Command: codeplaybook-create-usecase

Create a new use case following Clean Architecture's single-responsibility principle with proper boundary crossing.

#### When to Use
- Adding a new application-specific business rule
- Implementing a new API endpoint's core logic
- Extracting business logic from a controller

#### Context Validation Checkpoints
- What is the use case name? (e.g., CreateUser, PlaceOrder, GenerateReport)
- What input data does it need? (request model fields)
- What output data does it produce? (response model fields)
- What external systems does it interact with? (database, APIs, email)

#### Steps

##### 1. Create request and response models
Create input/output data structures in the use cases layer:
- Request model: contains only the data needed to execute
- Response model: contains only the data the caller needs

##### 2. Define gateway interfaces
For each external system the use case needs:
- Create an interface in the use cases layer describing the operations needed
- Name it by domain intent, not technology (e.g., `OrderRepository` not `PostgresOrderStore`)

##### 3. Create the use case class
Create the use case in the use cases layer:
- Constructor accepting gateway interfaces
- Single `execute(request)` method returning the response model
- Import only from entities and use case layer — nothing else

##### 4. Create the gateway implementation
In the interface adapters layer, create a class implementing each gateway interface:
- Translate between use case data structures and framework/database objects

##### 5. Create test file
Test the use case in isolation:
- Mock all gateway interfaces
- Verify business rules, not infrastructure behavior

### Command: codeplaybook-create-presenter

Create a presenter in the Interface Adapters layer that formats use case output for a specific delivery mechanism.

#### When to Use
- A use case output needs different formatting for REST vs GraphQL vs CLI
- Adding a new view or API response format for existing business logic
- Separating presentation logic from controller logic

#### Context Validation Checkpoints
- Which use case does this present?
- What delivery mechanism is it for? (REST JSON, GraphQL, HTML, CLI)
- What fields from the use case response need transformation?

#### Steps

##### 1. Create the presenter
In the interface adapters layer, create a presenter that:
- Accepts the use case response model
- Transforms it into the delivery-specific format
- Contains zero business logic — only formatting and mapping

##### 2. Wire it into the controller
The controller calls the use case, passes the response to the presenter, and returns the presenter's output.

## Framework Variants

### NestJS
Directory mapping:
- Entities: `src/entities/` (domain objects, core types)
- Use Cases: `src/usecases/` (each as `@Injectable()` service)
- Interface Adapters: `src/adapters/` (controllers, presenters, TypeORM repositories)
- Frameworks: `src/frameworks/` (NestJS modules, database config, external SDK setup)

Naming conventions:
- Entities: `{Name}.entity.ts`
- Use cases: `{Name}UseCase.ts` with `execute()` method
- Request/Response: `{Name}Request.ts`, `{Name}Response.ts`
- Gateways: `I{Name}Gateway.ts` (interface in usecases/)
- Gateway impls: `{Name}Gateway.ts` (in adapters/)
- Presenters: `{Name}Presenter.ts`

Additional rules:
* Use NestJS modules at the frameworks layer to wire everything together
* Controllers are interface adapters — they parse HTTP requests into use case request models
* TypeORM/Mongoose repositories are gateway implementations in the adapters layer
* Use custom NestJS providers to inject gateway implementations into use cases

### Spring Boot
Directory mapping:
- Entities: `src/main/java/.../entities/`
- Use Cases: `src/main/java/.../usecases/` (as `@Service` classes)
- Interface Adapters: `src/main/java/.../adapters/` (controllers as `@RestController`, repos as `@Repository`)
- Frameworks: `src/main/java/.../config/` (Spring configuration, beans)

Naming conventions:
- Entities: `{Name}.java`
- Use cases: `{Name}UseCase.java`
- Gateways: `{Name}Gateway.java` (interface in usecases/)
- Gateway impls: `{Name}GatewayImpl.java` (in adapters/)

Additional rules:
* Use Spring constructor injection to wire gateways into use cases
* `@Configuration` classes in frameworks layer define bean bindings
* JPA entities in adapters layer map to domain entities — they are not the same class

### FastAPI
Directory mapping:
- Entities: `src/entities/` (Pydantic models, dataclasses)
- Use Cases: `src/usecases/` (plain Python classes)
- Interface Adapters: `src/adapters/` (FastAPI routers, SQLAlchemy repos)
- Frameworks: `src/frameworks/` (FastAPI app setup, DB engine config)

Naming conventions:
- Entities: `{name}.py` (class: `{Name}`)
- Use cases: `{name}_usecase.py` (class: `{Name}UseCase`)
- Gateways: `{name}_gateway.py` (protocol: `{Name}Gateway`)

Additional rules:
* Use FastAPI `Depends()` for dependency injection of gateways into routers
* Routers are interface adapters — they convert HTTP requests to use case request models
* SQLAlchemy models are distinct from domain entities

### Go
Directory mapping:
- Entities: `internal/entities/`
- Use Cases: `internal/usecases/`
- Interface Adapters: `internal/adapters/` (HTTP handlers, DB repositories)
- Frameworks: `cmd/` and `internal/config/`

Naming conventions:
- Entities: `{name}.go` (struct: `{Name}`)
- Use cases: `{name}_usecase.go` (struct: `{Name}UseCase`)
- Gateways: interfaces defined in `internal/usecases/`
- Gateway impls: `{name}_gateway.go` in adapters/

Additional rules:
* Gateway interfaces defined in usecases/ package — Go's implicit interfaces make this natural
* `cmd/main.go` wires all dependencies together
* HTTP handlers in adapters/ convert requests and delegate to use cases

### Express
Directory mapping:
- Entities: `src/entities/`
- Use Cases: `src/usecases/`
- Interface Adapters: `src/adapters/` (route handlers, database repos)
- Frameworks: `src/config/` (Express app setup, middleware)

Naming conventions:
- Entities: `{Name}.ts`
- Use cases: `{Name}UseCase.ts`
- Gateways: `I{Name}Gateway.ts` (interface)
- Gateway impls: `{Name}Gateway.ts`

Additional rules:
* Route handlers are interface adapters — they parse req/res and call use cases
* Use a DI container or manual factory functions to inject gateways
* Express middleware belongs in the frameworks layer
