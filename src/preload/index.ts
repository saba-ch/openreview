import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { GIT_DIFF, GIT_STAGE, GIT_UNSTAGE, OPEN_DIALOG, CLIPBOARD_WRITE, SYNC_COMMENTS, MCP_ADD_COMMENT, MCP_DELETE_COMMENT } from '../shared/types.js'
import type { DiffFile, Comment } from '../shared/types.js'

contextBridge.exposeInMainWorld('electron', {
  openDialog: (): Promise<string | null> =>
    ipcRenderer.invoke(OPEN_DIALOG),

  getRepoDiff: (rootPath: string): Promise<DiffFile[]> =>
    ipcRenderer.invoke(GIT_DIFF, rootPath),

  stageFile: (rootPath: string, filePath: string): Promise<void> =>
    ipcRenderer.invoke(GIT_STAGE, rootPath, filePath),

  unstageFile: (rootPath: string, filePath: string): Promise<void> =>
    ipcRenderer.invoke(GIT_UNSTAGE, rootPath, filePath),

  writeClipboard: (text: string): Promise<void> =>
    ipcRenderer.invoke(CLIPBOARD_WRITE, text),

  syncComments: (comments: Record<string, Comment>): void =>
    ipcRenderer.send(SYNC_COMMENTS, comments),

  onMcpAddComment: (cb: (c: Comment) => void): (() => void) => {
    const h = (_e: IpcRendererEvent, c: Comment) => cb(c)
    ipcRenderer.on(MCP_ADD_COMMENT, h)
    return () => ipcRenderer.removeListener(MCP_ADD_COMMENT, h)
  },

  onMcpDeleteComment: (cb: (id: string) => void): (() => void) => {
    const h = (_e: IpcRendererEvent, id: string) => cb(id)
    ipcRenderer.on(MCP_DELETE_COMMENT, h)
    return () => ipcRenderer.removeListener(MCP_DELETE_COMMENT, h)
  },
})
