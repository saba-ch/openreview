import { contextBridge, ipcRenderer } from 'electron'
import { GIT_DIFF, GIT_STAGE, GIT_UNSTAGE, OPEN_DIALOG, CLIPBOARD_WRITE } from '../shared/types.js'
import type { DiffFile } from '../shared/types.js'

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
    ipcRenderer.invoke(CLIPBOARD_WRITE, text)
})
