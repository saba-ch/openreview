import { create } from 'zustand'
import { DiffFile } from '../../shared/types'

interface RepoStoreState {
  rootPath: string | null
  files: DiffFile[]
  selectedFile: DiffFile | null
  isLoading: boolean
  setRootPath: (rootPath: string | null) => void
  setFiles: (files: DiffFile[]) => void
  setSelectedFile: (file: DiffFile | null) => void
  setLoading: (isLoading: boolean) => void
}

export const useRepoStore = create<RepoStoreState>((set) => ({
  rootPath: null,
  files: [],
  selectedFile: null,
  isLoading: false,
  setRootPath: (rootPath) => set({ rootPath }),
  setFiles: (files) => set({ files }),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setLoading: (isLoading) => set({ isLoading }),
}))
