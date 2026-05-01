# Error Handling Patterns

Analyze how errors are created, propagated, and reported across the codebase. Surface inconsistencies in error handling style that cause silent failures or confusing error messages.

## What to Look For

Error handling conventions are rarely documented but deeply affect reliability. This analysis makes the implicit patterns explicit and flags dangerous inconsistencies.

### Error Propagation Styles

```
# Throw/raise (exception-based)
throw new Error(       throw new *Error(
raise ValueError(      raise *Error(
throw *Exception(      throws                    # Java
panic(                                           # Go (misuse indicator)

# Return-based (Result/Either/error values)
Result<             Either<             Ok(       Err(
return { error:     return { success:
err != nil                                       # Go idiomatic
return None         return null                   # Nullable returns as error

# Callback-based
callback(err        cb(err              next(err
(err, result) =>    (error, data) =>
```

### Custom Error Classes / Types

```
# Custom error definitions
extends Error {         extends *Error {
class *Error            class *Exception
type *Error struct      # Go custom errors
errors.New(             fmt.Errorf(              # Go stdlib
*Error = class(Exception)                        # Python

# Error codes / enums
ErrorCode               ERROR_*
*ErrorType              *ErrorKind
```

### Error Swallowing (Red Flags)

```
# Empty catch blocks
catch (e) {}            catch (e) { }
catch (*) {}
except:                 except Exception:        # Python bare except
catch (Exception e) {}                           # Java
rescue =>                                        # Ruby bare rescue

# Silenced errors
catch (e) { console.log    catch (e) { log      # Log-only, no rethrow
.catch(() => {})           .catch(() => null)
_ = err                                          # Go ignored error
```

### Error Response Shapes (API boundaries)

```
# Structured error responses
{ error: { message:     { error: { code:
{ errors: [             { message:, status:
HttpException(          BadRequestException(     # NestJS
HttpResponse(status=    Response(status=         # Django/Flask
status(4**)             status(5**)

# Error middleware / interceptors
@Catch(                 ExceptionFilter          # NestJS
@ExceptionHandler       @ControllerAdvice        # Spring
errorHandler(           app.use(err,             # Express
```

### Error Logging

```
# Logging at error boundaries
logger.error(           console.error(
log.Error(              log.Fatal(               # Go
logging.error(          logging.exception(       # Python
LOG.error(              log.error(               # Java/SLF4J
```

## Analysis Method

1. **Classify propagation style**: Sample 5-8 files across services/controllers/handlers. Determine if the codebase uses throw-based, return-based, or mixed error propagation.
2. **Check for custom errors**: Search for custom error class definitions. Note if they exist but are used inconsistently.
3. **Detect error swallowing**: Search for empty catch blocks and log-only catches. These are always worth flagging.
4. **Check API error shapes**: In controllers/handlers, determine if error responses follow a consistent structure (status codes, error body format).
5. **Assess logging**: Check if errors are logged consistently at boundaries.

## Reporting Threshold

Report if:
- ≥2 different error propagation styles in the same role category (e.g., some services throw, others return), OR
- ≥2 instances of error swallowing detected, OR
- API error responses use ≥2 different shapes

## Insight Template

```
INSIGHT:
  id: ERRORS-[n]
  title: "ERROR HANDLING: [description of inconsistency]"
  summary: "[N] files use [style A], [M] files use [style B]. [error swallowing count] empty catch blocks found."
  confidence: [high|medium|low]
  evidence:
    propagation_styles:
      - style: "[throw | return | callback]"
        files:
          - path[:line] — uses [pattern]
    custom_errors:
      - path[:line] — defines [ErrorClassName]
    swallowed_errors:
      - path[:line] — empty catch / log-only catch
    api_error_shapes:
      - path[:line] — returns [shape]
```

## Output Suggestions

### Standard: Error Handling Consistency

- "Use [throw/return] for error propagation in all [services/use cases]"
- "Never swallow errors with empty catch blocks; rethrow, return, or log with context"
- "All custom errors must extend [BaseError/AppError] and include an error code"
- "API error responses must follow the shape: `{ error: { code, message } }`"
- "Log errors with context (operation, input identifiers) at service boundaries"
