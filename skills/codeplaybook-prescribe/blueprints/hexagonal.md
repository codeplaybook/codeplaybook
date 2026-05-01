# Hexagonal Architecture (Ports & Adapters)

Separates business logic from infrastructure concerns through explicit boundaries. The domain layer defines **ports** (interfaces for what it needs) and the infrastructure layer provides **adapters** (concrete implementations). This ensures the domain is testable in isolation and infrastructure is swappable.

Three layers:
- **Domain**: Business logic, entities, value objects, domain services, port interfaces
- **Application**: Use cases that orchestrate domain logic, input/output DTOs
- **Infrastructure**: Adapters for databases, APIs, messaging, HTTP controllers

## Standards

### Standard: Hexagonal Layer Boundaries

#### Scope
All backend source files

#### Rules
* Domain layer must have zero imports from Application or Infrastructure layers
* Application layer may import from Domain only — never from Infrastructure
* Infrastructure layer may import from both Domain and Application
* All cross-layer communication must go through port interfaces defined in Domain
* No framework-specific annotations or decorators in the Domain layer

### Standard: Hexagonal Directory Structure

#### Scope
All backend source files

#### Rules
* Place domain entities, value objects, and domain services in the domain layer directory
* Place use cases and application services in the application layer directory
* Place database adapters, API clients, HTTP controllers, and event handlers in the infrastructure layer directory
* Place port interfaces (abstractions) in the domain layer, not in infrastructure
* Each bounded context or module should replicate the three-layer structure internally

### Standard: Port & Adapter Pattern

#### Scope
All backend source files

#### Rules
* Define ports as interfaces in the domain layer for every external dependency (database, API, messaging)
* Implement each port as an adapter in the infrastructure layer
* Inject adapters through constructor injection — domain and application code must never instantiate adapters directly
* Name ports to describe domain intent (e.g., `UserRepository`, `NotificationSender`) not infrastructure (e.g., `PostgresClient`, `SESMailer`)
* Test domain and application layers using in-memory or mock adapters

## Commands

### Command: codeplaybook-create-usecase

Create a new use case in the Application layer with proper port injection and layer boundaries.

#### When to Use
- Implementing a new business workflow or operation
- Extracting business logic from a controller into the application layer
- Adding a new feature that coordinates multiple domain services

#### Context Validation Checkpoints
- What is the use case name? (e.g., CreateOrderUseCase, TransferFundsUseCase)
- Which domain entities does it operate on?
- What ports (external dependencies) does it need? (e.g., repository, notification sender)

#### Steps

##### 1. Create the use case file
Create the use case in the application layer directory with:
- Constructor accepting port interfaces (not concrete implementations)
- An `execute` method with typed input DTO and output DTO
- Import domain entities and port interfaces from the domain layer only

##### 2. Define input/output DTOs
Create DTOs for the use case's input and output in the application layer:
- Input DTO: contains only the data needed to execute the use case
- Output DTO: contains only the data the caller needs back

##### 3. Create or verify port interfaces
For each external dependency the use case needs:
- Check if a port interface already exists in the domain layer
- If not, create one with methods describing domain intent

##### 4. Register dependency injection
Wire the use case into the framework's dependency injection container, injecting concrete adapters for each port.

##### 5. Create test file
Create a test file for the use case:
- Mock all port interfaces with in-memory implementations
- Test the business logic in isolation from infrastructure
- Follow the project's test naming convention

### Command: codeplaybook-create-adapter

Create a new infrastructure adapter that implements a domain port interface.

#### When to Use
- Adding a new database, API, or messaging integration
- Replacing an existing adapter with a different implementation (e.g., switching from PostgreSQL to MongoDB)
- Creating a test double (in-memory adapter) for a domain port

#### Context Validation Checkpoints
- Which port interface does this adapter implement?
- What infrastructure technology does it use? (e.g., PostgreSQL, Redis, gRPC, REST API)
- Is this a production adapter or a test/in-memory adapter?

#### Steps

##### 1. Identify the port interface
Find the port interface in the domain layer that this adapter will implement.

##### 2. Create the adapter file
Create the adapter in the infrastructure layer directory:
- Implement every method defined in the port interface
- Import the port interface from the domain layer
- Keep infrastructure-specific details (connection strings, SDK clients) encapsulated

##### 3. Register in dependency injection
Wire the adapter into the framework's DI container as the implementation for its port interface.

##### 4. Create test file
Create integration tests for the adapter that verify it correctly implements the port contract.

## Framework Variants

### NestJS
Directory mapping:
- Domain: `src/domain/` (entities, value objects, ports as TypeScript interfaces)
- Application: `src/application/` (use cases as `@Injectable()` services)
- Infrastructure: `src/infrastructure/` (adapters as `@Injectable()` providers, controllers with `@Controller()`)

Naming conventions:
- Use cases: `{Name}UseCase.ts` (class: `{Name}UseCase`)
- Ports: `{Name}Port.ts` (interface: `I{Name}Port`)
- Adapters: `{Name}Adapter.ts` (class: `{Name}Adapter`)
- Entities: `{Name}.entity.ts`
- Value objects: `{Name}.value-object.ts`

Additional rules:
* Use `@Module()` per bounded context, importing only the application and infrastructure layers
* Use NestJS custom providers (`useClass`, `useFactory`) to bind ports to adapters
* Controllers belong in infrastructure — they handle HTTP and delegate to use cases
* gRPC handlers (`@GrpcMethod()`) belong in infrastructure alongside controllers

Module structure:
```
src/{module-name}/
  domain/
    entities/
    ports/
    value-objects/
  application/
    usecases/
    dtos/
  infrastructure/
    adapters/
    controllers/
  {module-name}.module.ts
```

### Spring Boot
Directory mapping:
- Domain: `src/main/java/.../domain/` (entities, value objects, port interfaces)
- Application: `src/main/java/.../application/` (use cases as `@Service` classes)
- Infrastructure: `src/main/java/.../infrastructure/` (adapters as `@Repository`/`@Component`, controllers as `@RestController`)

Naming conventions:
- Use cases: `{Name}UseCase.java`
- Ports: `{Name}Port.java` (interface)
- Adapters: `{Name}Adapter.java` (class implementing port)

Additional rules:
* Use Spring constructor injection (no `@Autowired` on fields)
* Define port interfaces in domain; implement with `@Component` or `@Repository` in infrastructure
* Controllers use `@RestController` and delegate to use cases only

### FastAPI
Directory mapping:
- Domain: `src/domain/` (entities as dataclasses/Pydantic models, ports as abstract classes/protocols)
- Application: `src/application/` (use cases as plain Python classes)
- Infrastructure: `src/infrastructure/` (adapters, FastAPI routers)

Naming conventions:
- Use cases: `{name}_usecase.py` (class: `{Name}UseCase`)
- Ports: `{name}_port.py` (protocol/abstract class: `{Name}Port`)
- Adapters: `{name}_adapter.py` (class: `{Name}Adapter`)

Additional rules:
* Use Python `Protocol` or `ABC` for port definitions
* FastAPI routers belong in infrastructure — they handle HTTP and call use cases
* Use dependency injection via FastAPI's `Depends()` to inject adapters

### Express
Directory mapping:
- Domain: `src/domain/` (entities, port interfaces as TypeScript interfaces)
- Application: `src/application/` (use cases as plain classes)
- Infrastructure: `src/infrastructure/` (adapters, Express route handlers)

Naming conventions:
- Use cases: `{Name}UseCase.ts`
- Ports: `{Name}Port.ts` (interface: `I{Name}Port`)
- Adapters: `{Name}Adapter.ts`
- Route handlers: `{name}.routes.ts`

Additional rules:
* Route handlers in infrastructure call use cases — no business logic in routes
* Use a DI container (tsyringe, inversify, or manual injection) to bind ports to adapters
* Middleware belongs in infrastructure

### Go
Directory mapping:
- Domain: `internal/domain/` (entities as structs, ports as interfaces)
- Application: `internal/application/` (use cases as structs with port dependencies)
- Infrastructure: `internal/infrastructure/` (adapters, HTTP handlers)

Naming conventions:
- Use cases: `{name}_usecase.go` (struct: `{Name}UseCase`)
- Ports: defined as interfaces in `internal/domain/ports/`
- Adapters: `{name}_adapter.go` (struct: `{Name}Adapter`)

Additional rules:
* Define port interfaces in domain — Go interfaces are implicit, so adapters don't need explicit `implements`
* Use constructor functions (`New{Name}UseCase(port Port)`) for dependency injection
* HTTP handlers in `internal/infrastructure/http/` delegate to use cases
* Keep `cmd/` for entry points that wire everything together
