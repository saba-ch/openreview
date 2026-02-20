# Future Ideas

## MCP Server — AI-native code review

Expose OpenReview's comment store via a local MCP server embedded in the Electron main process. Any MCP-compatible AI client (Claude Code, Cursor, etc.) can add and read comments directly without copy-pasting.

### Tools to expose

- `add_comment(filePath, lineNumber, text)` — adds a comment to the store; appears in the UI live via IPC
- `get_comments()` — returns all current comments
- `delete_comment(id)` — removes a comment
- `get_diff(filePath?)` — returns the current diff so Claude can review without needing direct repo access

### Workflow

```
User: "review the diff and comment on any issues"
Claude → get_diff()          → sees all changes
Claude → add_comment() × N   → comments appear in UI live
User reviews in OpenReview, edits or deletes as needed
User: "fix all the comments"
Claude → get_comments()      → reads all comments
Claude → fixes each one
Claude → delete_comment() × N → clears them
```

### Implementation notes

- MCP server runs on a fixed local port (e.g. `27182`) from the Electron main process
- User adds it once to their Claude Code MCP config:
  ```json
  { "mcpServers": { "openreview": { "type": "http", "url": "http://localhost:27182/mcp" } } }
  ```
- Comments from MCP and manual UI comments go into the same store — no distinction needed
- "Copy Review" stays as a plain-text fallback for non-MCP tools
