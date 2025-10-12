# Service Layer (`src/services`)

Two primary services extend the backend beyond CRUD APIs: the DSL `CommandInterpreter` and the executor bridge used by both server and client.

## CommandInterpreter (`CommandInterpreter.ts`)

### Overview
- Built on Chevrotain (lexer + CST parser) to interpret a domain-specific language for manipulating trees, nodes, categories, layers, and edges.
- Implements a singleton. Call `CommandInterpreter.initialize(executors)` during app bootstrap to inject `CommandExecutors`.
- Provides synchronous parsing (`parse`) and asynchronous execution (`executeScripts` / `executeScript`).

### Tokenization & Parsing
- Custom tokens (`create`, `tree`, `category`, `repeat`, etc.) defined by `createTokens()`.
- `TreeDslParser` grammar supports:
  - Atomic commands (`create tree`, `create node`, `connect`, `disconnect`).
  - `repeat <count> [ "param1", ... ] <command>;` blocks for batched command execution with placeholders.
- Visitor pattern translates CST nodes into strongly typed `DslCommand` objects.

### Execution Model
- Commands run sequentially with logging hooks.
- `repeat` commands push iteration indices and parameters onto context stacks; placeholders:
  - `$0` / `$$`: current repetition index.
  - `$1`, `$2`, ...: positional parameters supplied in the square bracket list.
- JSON payloads in scripts are parsed at execution time (`parsePropsText`) after placeholder substitution.
- Errors during lexing/parsing/execution are logged and thrown as `Error` instances with informative text.

### Public Surface
- `parse(source: string): DslCommand[]`
- `executeScripts(source: string, logHandler?: LogHandler): Promise<ExecutorResult[]>`
- `executeScript(source: string): void`

### DSL Command Reference

Each statement must terminate with `;`. String literals may be single or double quoted and support standard JSON escape sequences. JSON payloads are evaluated after placeholder substitution; invalid JSON produces a runtime error.

| Command | Formal Syntax | Description |
| ------- | ------------- | ----------- |
| `createTree` | `create tree <name:string> props <props:json>` | Creates a tree. `name` is any quoted string. `props` must serialize to JSON; by default the interpreter parses it into an object passed to the executor. |
| `createCategory` | `create category <name:string> parent <parent:string> [ props <props:json> ]` | Declares a node category with an optional JSON props object. `parent` is a string identifier resolved by downstream executors. |
| `createLayer` | `create layer <name:string> [ props <props:json> ]` | Creates an edge layer with optional props. |
| `createNode` | `create node <name:string> parent <parent:string> category <category:string> [ props <props:json> ]` | Inserts a node beneath `parent`, typed by `category`. Props default to `{}` if omitted. |
| `connect` | `connect <name:string> <from:string> <to:string> layer <layer:string> [ props <props:json> ]` | Establishes a connection (edge) from `from` to `to` within `layer`. |
| `disconnect` | `disconnect <name:string>` | Removes a previously created connection. |
| `repeat` | `repeat <count:int> [ <param1:string> [, <paramN:string> ]* ] <command>` | Executes `<command>` `count` times. Optional parameter list supplies substitution values (`$1`, `$2`, ...). Within the block: `$0` (or `$$`) resolves to the zero-based iteration index; positional placeholders resolve using the parameter array. Nested repeats maintain independent stacks. |

**Placeholder Semantics**
- Placeholders apply to `name`, `parent`, JSON props, etc. after the interpreter parses string literals.
- `$0` or `$$` require being inside a `repeat` block; using them elsewhere throws an error.
- `$n` (n > 0) resolves to the nth parameter provided in the enclosing `repeat` declaration; accessing out-of-range indices throws.

**Execution Guarantees**
- Commands execute sequentially in the order written.
- Each `repeat` iteration reuses the same resolved command structure but with placeholder substitution applied at execution time.
- Executors are responsible for persisting or mutating domain state; the interpreter only coordinates parameter handling and logging.

## ExecutorFns (`ExecutorFns.ts`)
- Defines the default executor implementation used inside the Express app via `createServerExecutors()`.
- Each executor logs invocations and returns a serializable payload describing the requested action (suitable for testing or future integration).
- `toSerializable` ensures returned objects are JSON-friendly even when input props contain complex values.

## CollectEnvData (`CollectEnvData.ts`)
- Singleton utility that captures process and host diagnostics.
- Fields include memory usage, CPU details, network interfaces, environment variable summary, and process metadata.
- Exposed via `/api1/env` route and used by the GUI to present environment health.

## Renderer-Specific Executors (`src/renderer/services/ExecutorFns.ts`)
- Provides client-side equivalents of `CommandExecutors`, forwarding logs back to the UI.
- Used by the GUI "Terminal" and "Tester" views to run DSL scripts locally without hitting the API.
