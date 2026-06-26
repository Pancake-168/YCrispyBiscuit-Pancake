# 🏗️ Architecture Overview

This document describes the current architecture of **App Eval Desktop**, a minimal, deterministic **Electron + TypeScript desktop executor** for the App Evaluation Agent system.

The desktop app has one purpose:

> Capture the screen → send to backend → receive a single backend-selected action → execute it → repeat.

All **perception, reasoning, planning, and decision-making** occur entirely on the backend.
The desktop application is strictly an **executor**.

There is **no**:

* UI detection
* Local CV or model inference
* Overlay rendering or UI annotation
* Autonomous decision logic

---

# ⚙️ High-Level System Design

App Eval Desktop follows the standard Electron multiprocess architecture:

```
Main Process       — Windows, Orchestrator, IPC, native capture
Renderer Process   — UI, logs, screenshots, evaluations, history
Preload Script     — Secure IPC boundary (renderer ↔ main)
```

### Responsibility split

**Backend**

* Interprets screenshots
* Tracks evaluation and TestCase state
* Selects exactly one action per step
* Produces human-readable action descriptions

**Desktop client**

* Captures the desktop
* Sends screenshots + execution context
* Executes mouse / keyboard actions
* Displays state, logs, timelines, and results

---

# ⚙️ Execution Model (Important)

App Eval Desktop runs in **TestCase-runner mode**.

* **Evaluations** are containers
* **TestCases** are the executable unit
* The desktop client never plans multiple steps on its own

The orchestrator repeatedly polls the backend for the **next assigned TestCase**, executes it to completion, then moves on.

---

# 🧩 Main Process (`src/main.ts`)

The main process is the system coordinator and IPC hub.

### Responsibilities

* Creates:

  * Main dashboard window
  * Compact always-on-top window
* Loads the native C++ Desktop Duplication addon
* Instantiates the **Orchestrator**
* Routes IPC calls from the renderer
* Manages window state, transparency, and capture exclusion
* Broadcasts agent state updates to all renderer windows

There are **no overlay or annotation windows** in the system.

---

# 🎨 Renderer Process (`src/renderer/pages/*`)

The renderer implements all visible UI.
It is sandboxed and has **no direct access to Node.js**.

### Tabs

#### 1. Apps Tab

* Browse apps, versions, and evaluations
* Lineage graph view for versions with branch focus
* Create apps + versions (upload or URL)
* Delete apps or versions
* Jump to evaluation history

#### 2. Evaluation Tab

* Assigned evaluations list
* Evaluation metadata (goal, app type, timestamps)
* TestCase list
* Delete evaluation
* Jump to history

#### 3. Run Tab

* Live screenshot preview
* Structured logs
* Step-by-step execution timeline
* Start / stop / pause / resume
* Compact mode toggle
* Agent execution context (goal, scratchpad, actions)

#### 4. History Tab

* Infinite scroll TestCase history
* Markdown rendering of results
* Copy / download summary
* Re-run TestCase

### Communication model

All renderer interaction goes through:

```
window.electronAPI.<method>
```

This guarantees a strict sandbox boundary.

---

# 🔒 Preload Script (`src/preload.ts`)

The preload script defines the **only allowed IPC surface**.

### Exposed capabilities

#### Agent control

* `startWorkflow()`
* `stopWorkflow()`
* `pauseWorkflow()`
* `resumeWorkflow()`
* `injectHumanPrompt(text)`

#### Evaluations & TestCases

* `getAssignedEvaluations()`
* `fetchEvaluation(id)`
* `deleteEvaluation(id)`

#### History

* `history:refresh`
* History fetch helpers

#### UI / system

* `toggleCompactMode()`
* `getLogBuffer()`
* `onLogUpdate()`
* `getServerStatus()`
* `pickTaskFile()`

#### Apps & Versions
  
  * `listApps({ search, appType, limit, offset })`
  * `listAppVersions(appId, limit, offset)`
  * `getAppVersionGraph(appId)`
  * `submitApp({ name, appType, version, source, appUrl, filePath })`
  * `deleteApp(appId)`
  * `deleteAppVersion(appId, versionId)`

No other APIs are visible to the renderer.

---

# 🤖 Agent Runtime (`src/agent/*`)

The agent runtime performs **only execution-level work**.

There is **no UI overlay subsystem**.

---

## 📸 Native Screen Capture (`src/agent/capture/native/*`)

Implemented in C++ using the **Windows Desktop Duplication API**.

### Features

* High-performance BGRA capture
* Accurate multi-monitor origin reporting
* Optional window exclusion via `WDA_EXCLUDEFROMCAPTURE`
* Stable, low-latency capture

### Output shape

```ts
{
  buffer: Buffer;   // BGRA pixels
  width: number;
  height: number;
  originX: number;
  originY: number;
}
```

Frames are converted to RGBA, encoded as PNG, and uploaded to the backend.

---

## 🖱️ Executor (`src/agent/executor.ts`)

Executes backend-selected actions using `@nut-tree-fork/nut-js`.

### Supported actions

```text
single_click
double_click
right_click
hover
drag
simulate_text_entry
direct_text_entry
keyboard_shortcut
scroll
wait
finish_task
```

### Execution guarantees

* Deterministic execution
* Click-through enabled during mouse actions
* Clipboard restored after direct text entry
* Tool lifecycle hooks emitted for UI and window control

The executor **only accepts screen-space coordinates**.

---

## ↔️ Coordinate Mapping (`src/agent/coord-mapper.ts`)

Handles mapping from backend-provided coordinates to screen space.

### Coordinate spaces

| Space    | Meaning                          |
| -------- | -------------------------------- |
| screen   | Absolute OS pixel coordinates    |
| capture  | PNG screenshot pixel coordinates |
| analysis | Backend model coordinate system  |

### Mapping behavior

* Backend specifies:

  * `space`
  * `normalized`
* Orchestrator selects the correct mapping path
* Executor always receives final **screen coordinates**

Mapping is **deterministic and backend-directed**.

---

# 🧠 Core Logic (`src/core/*`)

---

## Orchestrator (`src/core/orchestrator.ts`)

The orchestrator is the **heart of the system**.

It implements a **TestCase-runner loop**, not an evaluation planner.

### Responsibilities

1. Poll backend for the next assigned TestCase

2. Fetch the owning Evaluation

3. Launch the target environment:

   * Local executable, or
   * Web URL (private browser session)

4. Mark TestCase as `in_progress`

5. Enter the step loop (max 40 steps):

   * Capture screenshot
   * Assemble `AgentExecutionContext`
   * POST screenshot + context to backend
   * Receive **one action**
   * Execute action locally
   * Update context, logs, and UI

6. Terminate when:

   * `finish_task` is received
   * an unrecoverable error occurs
   * user stops execution
   * no TestCases remain

7. Upload final results and mark TestCase complete

8. Tear down launched application

---

### Vision Analysis (Non-Streaming)

Each step performs **exactly one** backend call:

```http
POST /api/v1/vision/analyze
```

Returns:

```ts
{
  thought: string;
  action: {
    tool_name: string;
    parameters: object;
  };
  description?: string;
}
```

There is **no SSE**, no partial streaming, and no `done` event.

---

### Human-in-the-Loop Support


---

### Logging

All logs are structured and categorized:

```text
SYSTEM, JOB, AGENT, TOOL, CAPTURE, WARN, ERROR
```

Logs are broadcast to all renderer windows in real time.

---

# 🌐 Backend API Layer (`src/api/client.ts`)

Handles all REST communication.

### TestCase polling

```http
GET /api/v1/testcases/next?executor_id=<id>
```

### TestCase updates

```http
PATCH /api/v1/testcases/:id
```

### Vision analysis

```http
POST /api/v1/vision/analyze
```

### Evaluation access

```http
GET    /api/v1/evaluations/:id
DELETE /api/v1/evaluations/:id
PATCH  /api/v1/evaluations/:id/summary
POST   /api/v1/evaluations/:id/regenerate-summary
```

### Apps and versions

```http
GET    /api/v1/apps
POST   /api/v1/apps
  DELETE /api/v1/apps/:id
  GET    /api/v1/apps/:id/versions
  GET    /api/v1/apps/:id/versions/graph
  POST   /api/v1/apps/:id/versions
DELETE /api/v1/apps/:id/versions/:version_id
GET    /api/v1/apps/:id/versions/:version_id/evaluations
```

See `ENDPOINTS.md` for authoritative schemas.

---

# 🪟 Window System Architecture

### Main window

* Screenshot preview
* Logs
* Execution timeline
* Controls
* Evaluation / TestCase panels
* Agent context
* Theme and language toggles

### Compact window

* Always-on-top
* Minimal logs
* Status indicator
* Start / stop controls

There is **no overlay window** in the system.

---

# 📦 Project Layout Summary

```
src/
├── core/                orchestrator, logger, context
├── agent/               executor, coordinate mapping, capture
│   └── capture/native/  C++ Desktop Duplication addon
├── renderer/            pages/main + pages/compact UI
├── api/                 backend REST client
├── main.ts              Electron entry point
├── preload.ts           IPC boundary
└── config.ts            configuration
```

---

# 🧪 Testing Utilities

### Native capture test

```bash
npx ts-node test/test-window-capture.ts
```

Validates the native capture pipeline independently.

---

# 📝 Summary

App Eval Desktop is a **deterministic automation executor**:

* Backend performs all reasoning
* Desktop executes exactly one instructed action per step
* No local models
* No overlays
* High-performance native capture
* Precise coordinate mapping
* Strong Electron sandboxing
* Robust, inspectable execution flow

This architecture prioritizes **clarity, correctness, and debuggability** over autonomy.
