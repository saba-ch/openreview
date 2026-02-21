import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron'
import { join } from 'path'
import { getRepoDiff, stageFile, unstageFile } from './git.js'
import { GIT_DIFF, GIT_STAGE, GIT_UNSTAGE, OPEN_DIALOG, CLIPBOARD_WRITE, SYNC_COMMENTS } from '../shared/types.js'
import { mainStore } from './store.js'
import { startMcpServer, notifyCommentChange } from './mcp.js'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(GIT_DIFF, async (_event, rootPath: string) => {
    mainStore.rootPath = rootPath
    const diff = await getRepoDiff(rootPath)
    mainStore.diffCache = diff
    return diff
  })

  ipcMain.on(SYNC_COMMENTS, (_event, comments) => {
    mainStore.comments = comments
    notifyCommentChange()
  })

  ipcMain.handle(GIT_STAGE, (_event, rootPath: string, filePath: string) => {
    return stageFile(rootPath, filePath)
  })

  ipcMain.handle(GIT_UNSTAGE, (_event, rootPath: string, filePath: string) => {
    return unstageFile(rootPath, filePath)
  })

  ipcMain.handle(OPEN_DIALOG, (_event) => {
    return dialog.showOpenDialog({
      properties: ['openDirectory']
    }).then((result) => {
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    })
  })

  ipcMain.handle(CLIPBOARD_WRITE, (_event, text: string) => {
    clipboard.writeText(text)
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  startMcpServer(() => BrowserWindow.getAllWindows()[0] ?? null)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
