# App Eval Desktop

App Eval Desktop is the **Electron + TypeScript executor** for the App Evaluation Agent system.

It runs as a **local TestCase executor** that:

* captures the desktop,
* sends screenshots + execution context to the backend,
* receives a **single decided action per step**, and
* executes that action deterministically on the local machine.

The desktop app is intentionally thin:
**no local perception, no UI parsing, no model inference**.
All reasoning and decision-making lives in the backend.

---

## Table of Contents

- [App Eval Desktop](#app-eval-desktop)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Core Responsibilities](#core-responsibilities)
    - [Capture](#capture)
    - [Execution](#execution)
    - [Orchestration](#orchestration)
    - [Visualization](#visualization)
  - [Execution Model](#execution-model)
    - [Current Model: **TestCase Runner**](#current-model-testcase-runner)
  - [System Architecture](#system-architecture)
  - [Data and Control Flow](#data-and-control-flow)
    - [Per-Step Loop](#per-step-loop)
  - [User Interface](#user-interface)
    - [Agent View (Run)](#agent-view-run)
    - [Apps](#apps)
    - [Evaluations](#evaluations)
    - [History](#history)
    - [Compact Mode](#compact-mode)
  - [IPC Contracts](#ipc-contracts)
  - [Backend API Contract](#backend-api-contract)
  - [Configuration](#configuration)
  - [Build and Run](#build-and-run)
  - [Development Notes](#development-notes)
  - [Troubleshooting](#troubleshooting)
    - [No screenshots](#no-screenshots)
    - [Actions misaligned](#actions-misaligned)
    - [Agent stuck](#agent-stuck)

---

## Overview

App Eval Desktop connects a **local executor machine** to the App Evaluation backend.

It performs:

* Native desktop capture via a **Node-API C++ addon** (Windows Desktop Duplication API)
* PNG encoding and upload of screenshots
* Context-aware orchestration of backend-selected actions
* Deterministic local execution using `@nut-tree-fork/nut-js`
* Rendering of agent state, logs, timelines, history, and evaluations

The backend performs **all vision and reasoning**.
The desktop app **only executes what it is told**.

---

## Core Responsibilities

App Eval Desktop is responsible for:

### Capture

* High-performance BGRA capture via Desktop Duplication API
* Multi-monitor aware
* Optional exclusion from capture (`WDA_EXCLUDEFROMCAPTURE`)
* Conversion to PNG before upload

### Execution

* Mouse actions: click, double-click, right-click, hover, drag, scroll
* Keyboard actions: shortcuts, simulated typing
* Clipboard-based direct text entry (paste)
* Deterministic waits and task completion

### Orchestration

* Polls backend for **next assigned TestCase**
* Runs TestCases sequentially
* Handles pause/resume/stop
* Manages app lifecycle (launch + teardown)

### Visualization

* Live screenshot preview
* Structured logs
* Step-by-step run timeline
* Agent context inspection
* Evaluation / TestCase history

---

## Execution Model

**Important:**
The desktop app no longer runs evaluation-level loops.

### Current Model: **TestCase Runner**

1. Desktop polls:

   ```
   GET /api/v1/testcases/next?executor_id=...
   ```
2. If a TestCase is assigned:

   * Fetch its parent Evaluation
   * Launch target app (desktop or web)
3. Run a **step loop**:

   * Capture screenshot
   * Send screenshot + context to backend
   * Receive **one action**
   * Execute action locally
4. Repeat until backend emits `finish_task`
5. Upload final results and mark TestCase complete
6. Tear down launched application

If no TestCases are available, the orchestrator **auto-stops**.

---

## System Architecture

```
app_eval_desktop
├── scripts/
│   ├── utils/copy-recursive.js
│   ├── copy-renderer.js
│   └── copy-native.js
├── src/
│   ├── main.ts              # Electron entry, windows, IPC
│   ├── preload.ts           # Secure IPC bridge
│   ├── config.ts            # Runtime configuration
│   │
│   ├── core/
│   │   ├── orchestrator.ts  # TestCase runner loop
│   │   ├── context.ts       # AgentExecutionContext
│   │   └── logger.ts        # Structured logging
│   │
│   ├── agent/
│   │   ├── executor.ts      # nut-js action executor
│   │   ├── coord-mapper.ts  # analysis/capture → screen mapping
│   │   └── capture/native/  # C++ Desktop Duplication addon
│   │
│   ├── api/
│   │   └── client.ts        # REST + vision calls
│   │
│   ├── renderer/
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── zh.json
│   │   │
│   │   ├── pages/
│   │   │   ├── compact/
│   │   │   │   ├── compact.js
│   │   │   │   └── index.html
│   │   │   │
│   │   │   └── main/
│   │   │       ├── app.js
│   │   │       ├── evaluation.js
│   │   │       ├── history.js
│   │   │       ├── index.html
│   │   │       ├── mdeditor.js
│   │   │       └── renderer.js
│   │   │
│   │   ├── shared/
│   │   │   ├── context-helpers.js
│   │   │   ├── i18n.js
│   │   │   └── ui-helpers.js
│   │   │
│   │   └── styles/
│   │       ├── app.css
│   │       ├── base.css
│   │       ├── compact.css
│   │       ├── evaluation.css
│   │       ├── history.css
│   │       ├── mdeditor.css
│   │       └── style.css
│   │
│   └── types/
│       └── evaluations.d.ts
├── test/
│   └── test-window-capture.ts
├── ARCHITECTURE.md
├── ENDPOINTS.md
└── README.md
```

---

## Data and Control Flow

### Per-Step Loop

1. **Capture**

   * Native screenshot → PNG
   * Brightness sanity check (avoid black frames)

2. **Context Assembly**

   * AgentExecutionContext
   * Last focus coordinates

3. **Vision Analysis**

   ```
   POST /api/v1/vision/analyze
   ```

   * Non-streaming
   * Returns `{ thought, action, description }`

4. **Action Execution**

   * Coordinates mapped via `coord-mapper.ts`
   * Click-through enabled during execution
   * Tool lifecycle events emitted

5. **State Update**

   * Scratchpad appended
   * Action history updated
   * UI timeline event emitted

---

## User Interface

### Agent View (Run)

* Live screenshot preview
* Step timeline (thought + action + screenshot)
* Structured logs (SYSTEM / JOB / AGENT / TOOL / CAPTURE / WARN / ERROR)
* Pause / resume
* Compact mode toggle

### Apps

* Browse apps, versions, and evaluations
* Focus a lineage branch and reset focus
* Create apps + versions (upload or URL)
* Delete apps or versions
* Jump to evaluation history

### Evaluations

* Assigned evaluations list
* Metadata: goal, app type, timestamps
* Link to history
* Delete evaluation
* Regenerate or edit summary (for completed evaluations)

### History

* Infinite scroll TestCase history
* Markdown rendering of results
* Copy / download summary
* Re-run TestCase

### Compact Mode

* Always-on-top minimal window
* Logs + status
* Execution controls

---

## IPC Contracts

Renderer communicates **only via preload IPC**.

Key channels include:

* `getAssignedEvaluations`
* `fetchEvaluation`
* `deleteEvaluation`
* `run:start / pause / resume / stop`
* `injectHumanPrompt`
* `agent-context-updated`
* `evaluation-attached`
* `run-timeline-entry`
* `history:refresh`
* `getLogBuffer / onLogUpdate`

---

## Backend API Contract

Key endpoints used:

* `GET /api/v1/apps`
* `POST /api/v1/apps`
* `DELETE /api/v1/apps/{app_id}`
* `GET /api/v1/apps/{app_id}/versions`
* `POST /api/v1/apps/{app_id}/versions`
* `DELETE /api/v1/apps/{app_id}/versions/{version_id}`
* `GET /api/v1/apps/{app_id}/versions/{version_id}/evaluations`
* `GET /api/v1/testcases/next`
* `PATCH /api/v1/testcases/{id}`
* `POST /api/v1/vision/analyze`
* `GET /api/v1/evaluations/{id}`
* `PATCH /api/v1/evaluations/{id}/summary`
* `POST /api/v1/evaluations/{id}/regenerate-summary`

See `ENDPOINTS.md` for authoritative schemas.

---

## Configuration

`.env`:

```env
API_BASE_URL=http://127.0.0.1:8000
EXECUTOR_ID=<unique-machine-id>
```

Additional behavior:

* Capture defaults controlled in `config.ts`
* Theme, language, executor ID configurable via Settings UI
* Executor ID persists across restarts

---

## Build and Run

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Run:

```bash
npm start
```

Package:

```bash
npm run make
```

Test native capture:

```bash
npx ts-node test/test-window-capture.ts
```

---

## Development Notes

* Renderer is fully sandboxed (no Node access)
* All side effects happen in `main` / `orchestrator`
* Vision is **non-streaming**
* Clipboard is restored after direct text entry
* Click-through is reference-counted to avoid stuck windows
* Max 40 steps per TestCase

---

## Troubleshooting

### No screenshots

* Rebuild native addon
* Update GPU drivers
* Run capture test script

### Actions misaligned

* Check `space` + `normalized` flags
* Verify capture resolution vs model space
* Inspect `coord-mapper.ts` logic 

### Agent stuck

* Confirm backend returns `finish_task`
* Check TestCase status transitions
* Inspect vision analyze logs

---

**App Eval Desktop is a deterministic executor, not an agent.**
The backend decides.
The desktop captures, executes, and reports—nothing more, nothing less.
