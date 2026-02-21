import type { DiffFile, Comment } from '../shared/types'

declare global {
  interface Window {
    electron: {
      openDialog(): Promise<string | null>
      getRepoDiff(rootPath: string): Promise<DiffFile[]>
      stageFile(rootPath: string, filePath: string): Promise<void>
      unstageFile(rootPath: string, filePath: string): Promise<void>
      writeClipboard(text: string): Promise<void>
      syncComments(comments: Record<string, Comment>): void
      onMcpAddComment(callback: (comment: Comment) => void): () => void
      onMcpDeleteComment(callback: (id: string) => void): () => void
      onMcpUpdateComment(callback: (id: string, text: string) => void): () => void
    }
  }
}

export {}
