# Hexagonal Architecture (Ports & Adapters)

Separates business logic from infrastructure concerns through explicit boundaries. The domain layer defines **ports** (interfaces for what it needs) and the infrastructure layer provides **adapters** (concrete implementations). This ensures the domain is testable in isolation and infrastructure is swappable.

Three layers:
- **Domain**: Business logic, entities, value objects, domain services, port interfaces
- **Application**: Use cases that orchestrate domain logic, input/output DTOs
- **Infrastructure**: Adapters for databases, APIs, messaging, HTTP controllers

## When to Use

- The system integrates with multiple external services (databases, APIs, message brokers) that may change over time
- You need to test business logic in complete isolation from infrastructure
- Infrastructure swappability is a real requirement (e.g., switching databases or replacing a third-party API)
- The domain is complex enough to justify explicit port/adapter boundaries

## Start Simpler If

- Your app is purely CRUD with almost no business logic today — you can adopt hexagonal later as complexity grows
- You're spiking or prototyping and plan to restructure before production

---

## Standards

### Standard: Hexagonal Layer Boundaries

#### Severity
High

#### Scope
All backend source files

#### Rules
* Domain layer must have zero imports from Application or Infrastructure layers
* Application layer may import from Domain only — never from Infrastructure
* Infrastructure layer may import from both Domain and Application
* All cross-layer communication must go through port interfaces defined in Domain
* No framework-specific annotations or decorators in the Domain layer

### Standard: Hexagonal Directory Structure

#### Severity
Medium

#### Scope
All backend source files

#### Rules
* Place domain entities, value objects, and domain services in the domain layer directory
* Place use cases and application services in the application layer directory
* Place database adapters, API clients, HTTP controllers, and event handlers in the infrastructure layer directory
* Place port interfaces (abstractions) in the domain layer, not in infrastructure
* Each bounded context or module should replicate the three-layer structure internally

### Standard: Port & Adapter Pattern

#### Severity
High

#### Scope
All backend source files

#### Rules
* Define ports as interfaces in the domain layer for every external dependency (database, API, messaging)
* Implement each port as an adapter in the infrastructure layer
* Inject adapters through constructor injection — domain and application code must never instantiate adapters directly
* Name ports to describe domain intent (e.g., `UserRepository`, `NotificationSender`) not infrastructure (e.g., `PostgresClient`, `SESMailer`)
* Test domain and application layers using in-memory or mock adapters

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
