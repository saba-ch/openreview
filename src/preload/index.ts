import { contextBridge } from 'electron'

// Expose safe APIs to renderer via contextBridge
contextBridge.exposeInMainWorld('electron', {
  // IPC handlers will be added in US-003
})
