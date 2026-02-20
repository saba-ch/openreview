// Shared TypeScript types for OpenReview

export interface DiffLine {
  lineNumber: number
  oldLineNumber: number | null
  newLineNumber: number | null
  type: 'added' | 'removed' | 'context' | 'hunk-header'
  content: string
}

export interface DiffHunk {
  header: string
  lines: DiffLine[]
}

export interface DiffFile {
  filePath: string
  oldFilePath: string
  hunks: DiffHunk[]
  additions: number
  deletions: number
  staged: boolean
}

export interface Comment {
  id: string
  filePath: string
  lineNumber: number
  text: string
  outdated: boolean
}

export interface RepoState {
  rootPath: string
  files: DiffFile[]
}

// IPC channel names
export const GIT_DIFF = 'git:diff' as const
export const GIT_STAGE = 'git:stage' as const
export const GIT_UNSTAGE = 'git:unstage' as const
export const OPEN_DIALOG = 'dialog:open' as const
