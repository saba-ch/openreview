import type { DiffFile } from '../shared/types'

declare global {
  interface Window {
    electron: {
      openDialog(): Promise<string | null>
      getRepoDiff(rootPath: string): Promise<DiffFile[]>
      stageFile(rootPath: string, filePath: string): Promise<void>
      unstageFile(rootPath: string, filePath: string): Promise<void>
      writeClipboard(text: string): Promise<void>
    }
  }
}

export {}
