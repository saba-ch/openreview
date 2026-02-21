import { createServer, IncomingMessage, ServerResponse } from 'http'
import { randomUUID } from 'crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'
import type { BrowserWindow } from 'electron'
import { mainStore } from './store.js'
import { MCP_ADD_COMMENT, MCP_DELETE_COMMENT, MCP_UPDATE_COMMENT } from '../shared/types.js'
import type { Comment } from '../shared/types.js'

const MCP_PORT = 27182

// Session registry — keeps McpServer/transport pairs alive for live push notifications.
const sessions = new Map<string, { server: McpServer; transport: StreamableHTTPServerTransport }>()

/** Broadcast notifications/resources/updated to all connected MCP clients. */
export function notifyCommentChange(): void {
  for (const { server } of sessions.values()) {
    server.server.sendResourceUpdated({ uri: 'comments://all' }).catch(() => {})
  }
}

function lineRefToInternal(filePath: string, lineRef: number): number | null {
  if (!mainStore.diffCache) return null
  for (const file of mainStore.diffCache) {
    if (file.filePath !== filePath) continue
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.newLineNumber === lineRef || line.oldLineNumber === lineRef) {
          return line.lineNumber
        }
      }
    }
  }
  return null
}

function internalToLineRef(filePath: string, internalLineNumber: number): number | null {
  if (!mainStore.diffCache) return null
  for (const file of mainStore.diffCache) {
    if (file.filePath !== filePath) continue
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.lineNumber === internalLineNumber) {
          return line.newLineNumber ?? line.oldLineNumber
        }
      }
    }
  }
  return null
}

function createMcpServer(getWindow: () => BrowserWindow | null): McpServer {
  const server = new McpServer({ name: 'openreview', version: '1.0.0' })

  // ── Tools ──────────────────────────────────────────────────────────────

  server.registerTool(
    'get_comments',
    {
      description: 'Get all comments currently in the review. Each comment includes lineRef (real file line number).',
      inputSchema: {
        filePath: z.string().optional().describe('Filter to a specific file path (optional)'),
      },
    },
    async (args) => {
      const all = Object.values(mainStore.comments)
      const filtered = args.filePath ? all.filter((c) => c.filePath === args.filePath) : all
      const comments = filtered.map((c) => ({
        id: c.id,
        filePath: c.filePath,
        lineRef: internalToLineRef(c.filePath, c.lineNumber),
        text: c.text,
        outdated: c.outdated,
      }))
      return { content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }] }
    }
  )

  server.registerTool(
    'add_comment',
    {
      description: 'Add a review comment to a specific line. Use lineRef values from get_diff.',
      inputSchema: {
        filePath: z.string().describe('The file path to comment on'),
        lineRef: z.number().int().describe('The real file line number (lineRef from get_diff)'),
        text: z.string().describe('The comment text'),
      },
    },
    async (args) => {
      const internalLine = lineRefToInternal(args.filePath, args.lineRef)
      if (internalLine === null) {
        return {
          content: [{
            type: 'text',
            text: `Line ${args.lineRef} not found in diff for ${args.filePath}. Call get_diff first to refresh the cache.`,
          }],
        }
      }

      const comment: Comment = {
        id: randomUUID(),
        filePath: args.filePath,
        lineNumber: internalLine,
        text: args.text,
        outdated: false,
      }

      mainStore.comments[`${comment.filePath}:${comment.lineNumber}`] = comment
      getWindow()?.webContents.send(MCP_ADD_COMMENT, comment)

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, comment }) }] }
    }
  )

  server.registerTool(
    'update_comment',
    {
      description: 'Edit the text of an existing review comment.',
      inputSchema: {
        id: z.string().describe('The comment ID to update'),
        text: z.string().describe('The new comment text'),
      },
    },
    async (args) => {
      const entry = Object.values(mainStore.comments).find((c) => c.id === args.id)
      if (!entry) {
        return { content: [{ type: 'text', text: `Comment ${args.id} not found.` }] }
      }
      entry.text = args.text
      getWindow()?.webContents.send(MCP_UPDATE_COMMENT, { id: args.id, text: args.text })
      return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] }
    }
  )

  server.registerTool(
    'delete_comment',
    {
      description: 'Delete a review comment by its ID.',
      inputSchema: {
        id: z.string().describe('The comment ID to delete'),
      },
    },
    async (args) => {
      const entry = Object.values(mainStore.comments).find((c) => c.id === args.id)
      if (!entry) {
        return { content: [{ type: 'text', text: `Comment ${args.id} not found.` }] }
      }

      delete mainStore.comments[`${entry.filePath}:${entry.lineNumber}`]
      getWindow()?.webContents.send(MCP_DELETE_COMMENT, args.id)

      return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] }
    }
  )

  // ── Resources ──────────────────────────────────────────────────────────

  server.registerResource(
    'comments://all',
    'comments://all',
    { description: 'All current review comments with lineRef (real file line numbers).' },
    async (uri) => {
      const comments = Object.values(mainStore.comments).map((c) => ({
        id: c.id,
        filePath: c.filePath,
        lineRef: internalToLineRef(c.filePath, c.lineNumber),
        text: c.text,
        outdated: c.outdated,
      }))
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(comments, null, 2) }],
      }
    }
  )

  return server
}

async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  getWindow: () => BrowserWindow | null
): Promise<void> {
  let body: unknown
  if (req.method === 'POST') {
    const raw = await new Promise<string>((resolve, reject) => {
      let data = ''
      req.on('data', (chunk: Buffer) => { data += chunk.toString() })
      req.on('end', () => resolve(data))
      req.on('error', reject)
    })
    try {
      body = JSON.parse(raw)
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }
  }

  // Route to existing session if one is active.
  const existingSessionId = req.headers['mcp-session-id'] as string | undefined
  if (existingSessionId) {
    const session = sessions.get(existingSessionId)
    if (session) {
      await session.transport.handleRequest(req, res, body)
      return
    }
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Session not found' }))
    return
  }

  // New session — create a persistent server + transport pair.
  const server = createMcpServer(getWindow)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sid) => {
      sessions.set(sid, { server, transport })
    },
    onsessionclosed: (sid) => {
      sessions.delete(sid)
    },
  })

  await server.connect(transport)
  await transport.handleRequest(req, res, body)
}

export function startMcpServer(getWindow: () => BrowserWindow | null): void {
  const httpServer = createServer((req, res) => {
    if (req.url !== '/mcp' || !['GET', 'POST', 'DELETE'].includes(req.method ?? '')) {
      res.writeHead(404)
      res.end()
      return
    }

    handleMcpRequest(req, res, getWindow).catch((err) => {
      console.error('[MCP] request error:', err)
      if (!res.headersSent) {
        res.writeHead(500)
        res.end()
      }
    })
  })

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[MCP] Port ${MCP_PORT} already in use — MCP server not started`)
    } else {
      console.error('[MCP] Server error:', err)
    }
  })

  httpServer.listen(MCP_PORT, '127.0.0.1', () => {
    console.log(`[MCP] OpenReview MCP server listening on http://127.0.0.1:${MCP_PORT}/mcp`)
  })
}
