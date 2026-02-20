# PRD: Code Review Tool (Electron + React + Bun)

## Introduction

A desktop code review tool built with Electron, React, and Bun. It opens a git repository, shows changed files (staged and unstaged), renders a diff view, and lets the user write free-text comments on specific lines. At the end, the user copies a structured plain-text review (file path + line number + comment) to paste into Claude or any AI assistant for fixes.

The tool is language/framework agnostic — it works on any git repository regardless of tech stack.

---

## Goals

- Open any git repository and show a live diff (staged + unstaged changes)
- Render a GitHub-style split/unified diff view per file
- Allow writing free-text comments on any changed line
- Collect all comments and export them as a plain-text review block
- Support staging and unstaging individual files
- Zero configuration — works out of the box on any repo

---

## User Stories

### US-001: Open a git repository
**Description:** As a user, I want to open a local folder so that the tool loads all git-tracked changes.

**Acceptance Criteria:**
- [ ] "Open Folder" button or drag-and-drop opens a directory
- [ ] Tool validates that the folder is a git repository (has `.git`)
- [ ] Error message shown if folder is not a git repo
- [ ] On load, `git diff` (unstaged) and `git diff --cached` (staged) are run
- [ ] File tree in the sidebar lists all changed files with +/- counts

---

### US-002: File tree sidebar
**Description:** As a user, I want to see all changed files in a sidebar so I can navigate between them.

**Acceptance Criteria:**
- [ ] Sidebar shows a collapsible file tree grouped by directory
- [ ] Each file shows: filename, `+N -M` diff stats, and staged/unstaged badge
- [ ] Clicking a file loads its diff in the main panel
- [ ] Currently selected file is highlighted
- [ ] Sidebar has a text filter input to search files by name
- [ ] Staged and unstaged sections are separated (like the screenshot)

---

### US-003: Diff view per file
**Description:** As a user, I want to see a readable diff for each file so I can review the changes.

**Acceptance Criteria:**
- [ ] Main panel renders a unified diff for the selected file
- [ ] Added lines shown with green background, removed with red
- [ ] Line numbers shown for both old and new sides
- [ ] Code is syntax-highlighted (language detected by file extension)
- [ ] Diff is scrollable for long files
- [ ] Hunk headers (e.g. `@@ -65,10 +65,12 @@`) are shown as collapsible separators

---

### US-004: Add a line comment
**Description:** As a user, I want to click on a line and write a comment so I can capture my review notes.

**Acceptance Criteria:**
- [ ] Hovering a line shows a `+` button in the gutter
- [ ] Clicking `+` opens an inline comment box below that line
- [ ] Comment box has a textarea, a "Comment" button, and a "Cancel" button
- [ ] Submitting saves the comment attached to that file + line number
- [ ] A comment indicator icon appears in the gutter for commented lines
- [ ] Clicking the gutter icon on a line with an existing comment opens it for editing
- [ ] Comments persist in memory for the session (no need for disk persistence in v1)

---

### US-005: View and edit existing comments
**Description:** As a user, I want to see all my comments so I can edit or delete them before copying.

**Acceptance Criteria:**
- [ ] Commented lines show a visible inline thread below the line
- [ ] Each comment shows its text and an "Edit" and "Delete" button
- [ ] Editing opens the textarea pre-filled with existing text
- [ ] Deleting removes the comment and the gutter indicator

---

### US-006: Stage and unstage files
**Description:** As a user, I want to stage or unstage files directly in the tool so I can manage my commit without leaving the app.

**Acceptance Criteria:**
- [ ] Each file in the sidebar has a checkbox or toggle for staged/unstaged state
- [ ] Checking stages the file (`git add <file>`), unchecking unstages it (`git restore --staged <file>`)
- [ ] Diff view updates after staging/unstaging
- [ ] "Stage All" and "Unstage All" buttons available in sidebar header

---

### US-007: Copy review as plain text
**Description:** As a user, I want to copy all my comments as a formatted plain-text block so I can paste it into Claude to get fixes.

**Acceptance Criteria:**
- [ ] "Copy Review" button visible in the top toolbar
- [ ] Button is disabled (grayed out) if there are zero comments
- [ ] Clicking copies the following format to clipboard:

```
apps/worker/src/transitions.ts:74 — "outputs field should not be included here"
apps/worker/src/transitions.ts:90 — "status should be 'completed' not 'applied'"
apps/worker/tsconfig.json:3 — "strict mode should be enabled"
```

- [ ] Each line follows the format: `<relative-file-path>:<line-number> — "<comment text>"`
- [ ] Comments are sorted by file path, then by line number
- [ ] A toast notification confirms "Review copied to clipboard"

---

### US-008: Refresh / reload diff
**Description:** As a user, I want to reload the diff so the tool reflects the latest state of my working tree.

**Acceptance Criteria:**
- [ ] "Refresh" button (or keyboard shortcut `Cmd+R`) re-runs git diff
- [ ] Comments on lines that no longer exist are marked as "outdated" but not deleted
- [ ] File tree updates to reflect new/removed changed files

---

## Functional Requirements

- FR-1: Run `git diff` and `git diff --cached` on the opened repository to get all changes
- FR-2: Parse unified diff format (standard git output) into a structured data model
- FR-3: Render diff lines with syntax highlighting by file extension
- FR-4: Attach comments to `{ filePath, lineNumber }` pairs
- FR-5: Export all comments as plain text: `<path>:<line> — "<comment>"`
- FR-6: Run `git add` / `git restore --staged` when user stages/unstages a file
- FR-7: Show staged vs unstaged sections separately in the file tree
- FR-8: Support any git repository regardless of language or framework

---

## Non-Goals (Out of Scope for v1)

- No GitHub/GitLab/Bitbucket integration — local git only
- No AI-powered suggestions — the user writes comments manually
- No multi-user collaboration — single user session only
- No commit creation — only diff viewing and staging
- No comment persistence to disk between sessions
- No split (side-by-side) diff view — unified diff only in v1
- No image diff support
- No merge conflict resolution UI

---

## Technical Considerations

- **Runtime:** Bun for all JS/TS execution (both main process and build)
- **Framework:** Electron for desktop shell, React for UI
- **Git operations:** Spawn `git` CLI commands via Electron's main process (no libgit2 binding needed in v1)
- **Diff parsing:** Use a library like `parse-diff` (npm) to parse unified diff output into structured hunks/lines
- **Syntax highlighting:** `shiki` or `highlight.js` — detect language by file extension
- **IPC:** Electron `ipcMain`/`ipcRenderer` for communication between main (git ops) and renderer (React UI)
- **Clipboard:** Electron's `clipboard` module for the copy review feature
- **State management:** Zustand for comments + selected file state (avoid React context for perf-sensitive paths)
- **Styling:** Tailwind CSS

### Performance Requirements

The tool must handle large real-world repos without degradation. The following constraints apply:

#### Virtual Lists (Critical)
- **Diff view:** The line list in `DiffView` must use a virtual scroller (`@tanstack/react-virtual`). Never render all diff lines to the DOM. A single file can have 10,000+ lines.
- **File tree sidebar:** If a repo has hundreds of changed files, the sidebar list must also be virtualized.
- **Row height:** Diff lines have fixed height (configurable, default `22px`). Comment boxes expand the row — the virtualizer must support dynamic/variable row heights for lines that have open comments.

#### Syntax Highlighting
- **Never highlight synchronously on the main thread for large files.** Highlight in a Web Worker or lazily per visible chunk.
- Use `shiki` in a worker thread: send the raw code chunk, receive back HTML tokens.
- Only highlight lines currently in the virtual window + a small overscan buffer (e.g. ±20 lines).
- Cache highlighted output per `{ filePath, chunkHash }` so switching back to a file is instant.

#### Git / IPC
- Run `git diff` in the Electron main process (never the renderer). Stream large diffs back to the renderer incrementally via IPC instead of sending one giant payload.
- Parse the diff in the main process before sending to renderer — send structured `{ hunks, lines }` objects, not raw strings.
- Debounce file-watcher events (if added in future) — do not re-run git diff more than once per 500ms.

#### React Rendering
- Memoize `DiffLine` with `React.memo` — it will re-render thousands of times during scroll without it.
- Use `useCallback` / `useMemo` for comment lookup functions passed as props to list items.
- The Zustand comment store must use selector subscriptions per line (not a single global subscription that re-renders the whole list on every comment change).
- Avoid storing derived state — compute `hasComment(lineKey)` from the store on demand.

#### Startup
- Lazy-load `shiki` and `parse-diff` — they are not needed until a repo is opened.
- App shell (window + sidebar skeleton) must render before git diff completes.
- Show a loading skeleton in the diff view while the git IPC call is in flight.

### Suggested Project Structure
```
codereview/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # App entry, window creation
│   │   └── git.ts      # Git command wrappers (diff, add, restore)
│   ├── renderer/       # React app
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Sidebar.tsx       # File tree
│   │   │   ├── DiffView.tsx      # Main diff panel
│   │   │   ├── DiffLine.tsx      # Single line with gutter + comment
│   │   │   ├── CommentBox.tsx    # Inline comment editor
│   │   │   └── Toolbar.tsx       # Top bar with Copy Review button
│   │   └── store/
│   │       └── comments.ts       # Comment state (Zustand)
│   └── shared/
│       └── types.ts    # Shared types between main and renderer
├── package.json
└── bunfig.toml
```

---

## Success Metrics

- User can open a repo, add 5+ line comments, and copy the full review in under 2 minutes
- Copy output pastes directly into Claude without any manual formatting
- Works on any git repo (Node, Python, Go, Rust, etc.) without configuration
- App starts (shell visible) in under 1 second; diff loads in under 2 seconds for repos with <500 changed files
- Scrolling a 5,000-line diff maintains 60fps with no jank
- Switching between files takes under 100ms (cached highlight) or under 500ms (cold)
- Memory usage stays under 200MB for repos with up to 1,000 changed files

---

## Open Questions

- Should the app remember the last opened repo on relaunch?
- Should outdated comments (on deleted lines) still appear in the copied review?
- Should there be a keyboard shortcut to quickly open the comment box on the focused line?
