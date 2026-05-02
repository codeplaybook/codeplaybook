# Cross-Cutting Concerns

Establishes consistent patterns for error handling, logging, and input validation across the entire codebase. These concerns apply regardless of architectural pattern — whether you use hexagonal, clean architecture, or feature slices.

Without explicit standards, these patterns drift fast: one service throws strings, another uses custom error classes, a third returns null. Logging is inconsistent — some endpoints log request/response, others log nothing. Validation happens in controllers, services, and database layers with no clear owner.

## When to Use

- Any project beyond a prototype — error handling and logging conventions matter from day one
- Pair this with an architecture blueprint (hexagonal, clean, feature slices) for complete coverage
- Existing codebases adopting consistent patterns for the first time

## Start Simpler If

- You're building a single-file script or CLI tool where structured error handling adds overhead

---

## Standards

### Standard: Error Handling

Errors must be explicit, typed, and never swallowed. Every error that crosses a boundary (service → controller, module → module) must carry enough context to debug without reading the source.

#### Severity

High

#### Scope

All backend source files

#### Rules

* Define domain-specific error classes that extend the language's base error type — never throw generic errors or raw strings
* Every error class must include: a machine-readable code (e.g., `USER_NOT_FOUND`), a human-readable message, and the original cause if wrapping another error
* Never swallow errors with empty catch/except blocks — at minimum log the error with context before deciding how to handle it
* Use a consistent error response shape for all API endpoints (e.g., `{ error: { code, message, details? } }`)
* Errors in async operations (promises, goroutines, background jobs) must be caught and logged — never let them disappear silently
* Distinguish between operational errors (expected: validation, not found, conflict) and programmer errors (unexpected: null reference, type error) — handle them differently
* Operational errors return appropriate HTTP status codes; programmer errors return 500 and are logged with full stack trace

### Standard: Logging

Logs must be structured, leveled, and consistent. Every log entry should be queryable and traceable back to the request or operation that produced it.

#### Severity

Medium

#### Scope

All backend source files

#### Rules

* Use structured logging (JSON or key-value pairs) — never use plain string concatenation for log messages
* Use consistent log levels: `error` (something failed), `warn` (something unexpected but recoverable), `info` (significant business events), `debug` (development details)
* Every log entry in a request context must include a correlation/request ID so the full request flow can be traced
* Never log sensitive data: passwords, tokens, API keys, full credit card numbers, personal information — mask or omit them
* Log at service boundaries: incoming requests (info), outgoing calls (debug), errors (error), and business events (info)
* Use a single logger instance or factory per module — never import different logging libraries in different files
* Background jobs and async operations must log their start, completion, and any errors with the job identifier

### Standard: Input Validation

Validate at the system boundary, trust internally. Every piece of external input must be validated before it enters the domain layer.

#### Severity

High

#### Scope

All backend source files handling external input (controllers, handlers, API routes, message consumers)

#### Rules

* Validate all external input at the entry point (controller/handler) — never pass raw user input to services or repositories
* Use a schema validation library (Zod, Joi, class-validator, Pydantic, etc.) — never write manual if-checks for request validation
* Validation errors must return 400-level responses with specific field-level error messages, not generic "invalid request"
* Internal service-to-service calls within the same process do not need re-validation — trust the domain types
* File uploads must validate: file size, file type (by content not just extension), and filename
* Query parameters used in database queries must be parameterized — never interpolate raw input into query strings

---

## Commands

### Command: create-error-class

Create a new domain-specific error class following the project's error handling pattern.

#### When to Use

- Adding a new feature that can fail in domain-specific ways
- Replacing a generic `throw new Error(...)` with a typed error

#### Context Validation Checkpoints

- Does an error class for this domain concept already exist?
- What HTTP status code should this error map to?

#### Steps

##### 1. Create the error class

Create a new error class in the appropriate location:
- If the error is feature-specific, place it in the feature directory
- If the error is shared across features, place it in the shared/errors directory

The error class must include:
- A machine-readable error code (constant string)
- A human-readable message (parameterizable)
- The original cause (optional, for wrapping)

##### 2. Register the error mapping

If the project uses a global error handler or error-to-HTTP-status mapping, add the new error class to it with the appropriate status code.

##### 3. Use the error

Replace generic throws with the new typed error in the relevant code paths.

---

## Framework Variants

### NestJS

**Error classes:**
- Extend `HttpException` or create domain exceptions mapped via an exception filter
- Place shared exceptions in `src/common/exceptions/` or `src/shared/exceptions/`
- Use `@nestjs/common` built-in exceptions for standard HTTP errors (NotFoundException, BadRequestException)

**Logging:**
- Use `@nestjs/common` Logger or inject a custom LoggerService
- Set up a global LoggerModule that provides a configured logger instance
- Use `Logger.log()`, `Logger.warn()`, `Logger.error()` with context parameter

**Validation:**
- Use `class-validator` decorators on DTO classes
- Enable `ValidationPipe` globally in `main.ts`
- DTOs validate at the controller level automatically

### Express

**Error classes:**
- Create a base `AppError` class extending `Error` with `statusCode` and `code` properties
- Place in `src/shared/errors/` or `src/errors/`
- Use an error-handling middleware (`(err, req, res, next)`) as the last middleware

**Logging:**
- Use `winston` or `pino` with JSON format
- Create a logger instance in `src/shared/logger.ts`
- Attach request ID via middleware (`req.id` using `uuid`)

**Validation:**
- Use `zod` or `joi` schemas in a validation middleware
- Validate `req.body`, `req.params`, `req.query` before the route handler

### FastAPI

**Error classes:**
- Create exception classes inheriting from `Exception` with `code` and `detail` fields
- Register exception handlers with `@app.exception_handler()`
- Place in `app/exceptions/` or feature-level directories

**Logging:**
- Use Python's `logging` module with `structlog` for structured output
- Configure in `app/core/logging.py`
- Add correlation ID middleware using `contextvars`

**Validation:**
- Use Pydantic models for request/response validation (built into FastAPI)
- Validation errors automatically return 422 with field-level details
- Custom validators via `@field_validator` decorator

### Go

**Error classes:**
- Define sentinel errors (`var ErrNotFound = errors.New(...)`) and custom error types implementing the `error` interface
- Use `fmt.Errorf("context: %w", err)` to wrap errors with context
- Place shared errors in `internal/errors/` or `pkg/errors/`

**Logging:**
- Use `slog` (standard library, Go 1.21+) or `zerolog`/`zap` for structured logging
- Pass logger via context or dependency injection
- Include request ID from middleware in all log entries

**Validation:**
- Use `go-playground/validator` with struct tags
- Validate in the handler layer before calling services
- Return structured error responses with field-level details

### Spring Boot

**Error classes:**
- Create exception classes extending `RuntimeException` with `errorCode` and `message` fields
- Use `@ControllerAdvice` with `@ExceptionHandler` for global error handling
- Place in `src/main/java/.../exception/` package

**Logging:**
- Use SLF4J with Logback (default in Spring Boot)
- Use MDC (Mapped Diagnostic Context) for request correlation IDs
- Configure log levels per package in `application.yml`

**Validation:**
- Use `jakarta.validation` annotations (`@NotNull`, `@Size`, `@Email`) on DTOs
- Enable with `@Valid` or `@Validated` on controller parameters
- `MethodArgumentNotValidException` handler returns field-level errors

### React / Frontend

**Error handling:**
- Use Error Boundaries to catch rendering errors at feature boundaries
- API errors handled in the data layer hooks — components receive error state via props
- Never show raw error messages to users — map error codes to user-friendly messages

**Logging:**
- Use a lightweight client-side logger (or `console.*` with a wrapper that can be swapped)
- Log: API call failures, unhandled promise rejections, Error Boundary catches
- Send critical errors to a monitoring service (Sentry, LogRocket, etc.)

**Validation:**
- Validate form input client-side using a form library (React Hook Form + Zod, Formik + Yup)
- Client validation is UX only — never trust it for security (server validates too)
- Show inline field-level errors, not alert boxes
