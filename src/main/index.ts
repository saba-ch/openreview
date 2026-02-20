import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron'
import { join } from 'path'
import { getRepoDiff, stageFile, unstageFile } from './git.js'
import { GIT_DIFF, GIT_STAGE, GIT_UNSTAGE, OPEN_DIALOG, CLIPBOARD_WRITE } from '../shared/types.js'

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
  ipcMain.handle(GIT_DIFF, (_event, rootPath: string) => {
    return getRepoDiff(rootPath)
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
