import React, { useState, useCallback } from 'react'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import DiffView from './components/DiffView'
import { useRepoStore } from './store/repo'
import { useCommentsStore } from './store/comments'

export default function App(): React.ReactElement {
  const [error, setError] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const rootPath = useRepoStore((state) => state.rootPath)
  const isLoading = useRepoStore((state) => state.isLoading)
  const setRootPath = useRepoStore((state) => state.setRootPath)
  const setFiles = useRepoStore((state) => state.setFiles)
  const setSelectedFile = useRepoStore((state) => state.setSelectedFile)
  const setLoading = useRepoStore((state) => state.setLoading)
  const comments = useCommentsStore((state) => state.comments)
  const hasComments = Object.keys(comments).length > 0

  const loadRepo = useCallback(
    async (path: string) => {
      setError(null)
      setLoading(true)
      try {
        const files = await window.electron.getRepoDiff(path)
        setFiles(files)
        setSelectedFile(files.length > 0 ? files[0] : null)
      } catch {
        setError('Not a git repository')
        setFiles([])
        setSelectedFile(null)
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
    await loadRepo(path)
  }, [setRootPath, loadRepo])

  const handleRefresh = useCallback(async () => {
    if (!rootPath) return
    await loadRepo(rootPath)
  }, [rootPath, loadRepo])

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
