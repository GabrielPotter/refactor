# Admin GUI (`src/renderer`)

The React-based administration console is built with Vite, React 19, and Material UI. It surfaces monitoring tools, DSL execution helpers, and placeholder views for future extensions.

## Entry Points
- `src/renderer/main.tsx`: bootstraps React with `ReactDOM.createRoot` and wraps `App` in `React.StrictMode`.
- `src/renderer/App.tsx`: renders the global layout, navigation, theming, and view switching logic.

## Layout & Navigation
- Uses Material UI `AppBar`, `Paper`, and `Stack` components to provide a sidebar navigation panel.
- Views are defined in an array with metadata (`key`, `label`, icon, refresh capability).
- `supportsRefresh` allows the view to opt-in to the top-level refresh button, which increments a `refreshToken` propagated to the view.

## Views

### ServiceOverview
- Path: `src/renderer/views/ServiceOverview.tsx`
- Fetches `/api1/env` and displays host diagnostics:
  - Memory usage, load averages, uptime.
  - Process metadata (`pid`, Node version, CLI args).
  - CPU and network interface details.
- Provides loading, error, and reload states using Material UI components like `CircularProgress`, `Alert`, `Card`.

### Placeholder
- Path: `src/renderer/views/Placeholder.tsx`
- Generic component used for unfinished views (Analytics, Storage, Topology). Displays title + description.

### TesterView
- Path: `src/renderer/views/TesterView.tsx`
- Features:
  - Local file upload into CodeMirror editor for quick JSON viewing/editing.
  - Client-side DSL execution using `CommandInterpreter` + renderer executors.
  - Ability to download edited input/output as `.txt`.
  - Adjustable editor font size and logging pane.

### TerminalView
- Path: `src/renderer/views/TerminalView.tsx`
- Provides a text area for DSL scripts, an execution button, and result log viewer.
- Executes scripts via `/api2/console`, displaying logs and results in tables.
- Handles error responses gracefully, showing status and server-provided logs.

## Shared Utilities
- `src/renderer/services/ExecutorFns.ts`: logs DSL commands in-browser, mirroring the server executor interface.
- `src/renderer/env.d.ts`: ambient type definitions for Vite/TypeScript.
- `src/renderer/index.html`: Vite entry template for mounting the React app.

## Building & Serving
- `npm run build:gui` compiles the Vite bundle into `dist/gui`.
- Express serves static assets at `/gui` and returns `index.html` for GET requests, enabling client-side routing.
