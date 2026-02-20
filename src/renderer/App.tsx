import React, { useState, useCallback, useEffect } from 'react'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import DiffView from './components/DiffView'
import { useRepoStore } from './store/repo'
import { useCommentsStore } from './store/comments'
import type { DiffFile } from '../../shared/types'

export default function App(): React.ReactElement {
  const [error, setError] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const rootPath = useRepoStore((state) => state.rootPath)
  const isLoading = useRepoStore((state) => state.isLoading)
  const selectedFile = useRepoStore((state) => state.selectedFile)
  const setRootPath = useRepoStore((state) => state.setRootPath)
  const setFiles = useRepoStore((state) => state.setFiles)
  const setSelectedFile = useRepoStore((state) => state.setSelectedFile)
  const setLoading = useRepoStore((state) => state.setLoading)
  const comments = useCommentsStore((state) => state.comments)
  const markOutdated = useCommentsStore((state) => state.markOutdated)
  const hasComments = Object.keys(comments).length > 0

  // Returns the new files on success, null on error
  const loadRepo = useCallback(
    async (path: string): Promise<DiffFile[] | null> => {
      setError(null)
      setLoading(true)
      try {
        const files = await window.electron.getRepoDiff(path)
        setFiles(files)
        return files
      } catch {
        setError('Not a git repository')
        setFiles([])
        setSelectedFile(null)
        return null
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setFiles, setSelectedFile]
  )

  const handleOpenFolder = useCallback(async () => {
    const path = await window.electron.openDialog()
    if (!path) return
    setRootPath(path)
    const files = await loadRepo(path)
    if (files) setSelectedFile(files.length > 0 ? files[0] : null)
  }, [setRootPath, loadRepo, setSelectedFile])

  const handleRefresh = useCallback(async () => {
    if (!rootPath) return
    const prevSelectedPath = selectedFile?.filePath
    const newFiles = await loadRepo(rootPath)
    if (!newFiles) return

    // Build a set of valid filePath:lineNumber pairs from the new diff
    const validLines = new Set<string>()
    for (const file of newFiles) {
      for (const hunk of file.hunks) {
        for (const line of hunk.lines) {
          validLines.add(`${file.filePath}:${line.lineNumber}`)
        }
      }
    }
    const newFilePathSet = new Set(newFiles.map((f) => f.filePath))

    // Mark comments outdated if their line or file no longer exists in the diff
    const currentComments = Object.values(useCommentsStore.getState().comments)
    for (const comment of currentComments) {
      if (comment.outdated) continue
      if (
        !newFilePathSet.has(comment.filePath) ||
        !validLines.has(`${comment.filePath}:${comment.lineNumber}`)
      ) {
        markOutdated(comment.filePath, comment.lineNumber)
      }
    }

    // Preserve previously selected file; fall back to first file
    const preserved = prevSelectedPath
      ? newFiles.find((f) => f.filePath === prevSelectedPath) ?? null
      : null
    setSelectedFile(preserved ?? (newFiles.length > 0 ? newFiles[0] : null))
  }, [rootPath, selectedFile, loadRepo, markOutdated, setSelectedFile])

  // Cmd+R / Ctrl+R keyboard shortcut for refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault()
        handleRefresh()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleRefresh])

  const handleCopyReview = useCallback(async () => {
    const allComments = Object.values(comments)
    const sorted = allComments.slice().sort((a, b) => {
      if (a.filePath < b.filePath) return -1
      if (a.filePath > b.filePath) return 1
      return a.lineNumber - b.lineNumber
    })
    const text = sorted
      .map((c) => {
        const prefix = c.outdated ? '[OUTDATED] ' : ''
        return `${c.filePath}:${c.lineNumber} — "${prefix}${c.text}"`
      })
      .join('\n')
    await window.electron.writeClipboard(text)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }, [comments])

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-950 text-gray-100">
      <Toolbar
        onOpenFolder={handleOpenFolder}
        onRefresh={handleRefresh}
        onCopyReview={handleCopyReview}
        hasComments={hasComments}
      />
      {toastVisible && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded bg-gray-700 px-4 py-2 text-sm text-white shadow-lg">
          Review copied to clipboard
        </div>
      )}
      <main className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : !rootPath ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-gray-500">Open a folder to start reviewing</p>
          </div>
        ) : (
          <>
            <Sidebar onRefreshDiff={handleRefresh} />
            <DiffView />
          </>
        )}
      </main>
    </div>
  )
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-1 flex-col gap-3 p-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-gray-800"
          style={{ width: `${60 + (i % 3) * 15}%` }}
        />
      ))}
    </div>
  )
}
