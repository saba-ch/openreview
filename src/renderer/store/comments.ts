import { create } from 'zustand'
import { Comment } from '../../shared/types'

interface CommentsStore {
  comments: Record<string, Comment>
  addComment: (comment: Comment) => void
  updateComment: (id: string, text: string) => void
  deleteComment: (id: string) => void
  markOutdated: (filePath: string, lineNumber: number) => void
  getCommentsForFile: (filePath: string) => Comment[]
  getComment: (filePath: string, lineNumber: number) => Comment | undefined
}

export const useCommentsStore = create<CommentsStore>((set, get) => ({
  comments: {},

  addComment: (comment) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [`${comment.filePath}:${comment.lineNumber}`]: comment,
      },
    })),

  updateComment: (id, text) =>
    set((state) => {
      const entry = Object.values(state.comments).find((c) => c.id === id)
      if (!entry) return state
      const key = `${entry.filePath}:${entry.lineNumber}`
      return { comments: { ...state.comments, [key]: { ...entry, text } } }
    }),

  deleteComment: (id) =>
    set((state) => {
      const entry = Object.values(state.comments).find((c) => c.id === id)
      if (!entry) return state
      const key = `${entry.filePath}:${entry.lineNumber}`
      const { [key]: _removed, ...rest } = state.comments
      return { comments: rest }
    }),

  markOutdated: (filePath, lineNumber) =>
    set((state) => {
      const key = `${filePath}:${lineNumber}`
      const entry = state.comments[key]
      if (!entry) return state
      return { comments: { ...state.comments, [key]: { ...entry, outdated: true } } }
    }),

  getCommentsForFile: (filePath) =>
    Object.values(get().comments).filter((c) => c.filePath === filePath),

  getComment: (filePath, lineNumber) =>
    get().comments[`${filePath}:${lineNumber}`],
}))
