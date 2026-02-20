import type { Comment, DiffFile } from '../shared/types.js'

export const mainStore: {
  comments: Record<string, Comment>
  rootPath: string | null
  diffCache: DiffFile[] | null
} = { comments: {}, rootPath: null, diffCache: null }
