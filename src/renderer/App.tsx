import React, { useState, useCallback } from 'react'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import { useRepoStore } from './store/repo'

export default function App(): React.ReactElement {
  const [error, setError] = useState<string | null>(null)
  const rootPath = useRepoStore((state) => state.rootPath)
  const isLoading = useRepoStore((state) => state.isLoading)
  const setRootPath = useRepoStore((state) => state.setRootPath)
  const setFiles = useRepoStore((state) => state.setFiles)
  const setSelectedFile = useRepoStore((state) => state.setSelectedFile)
  const setLoading = useRepoStore((state) => state.setLoading)

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

  const handleCopyReview = useCallback(() => {
    // Will be implemented in US-011
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-950 text-gray-100">
      <Toolbar
        onOpenFolder={handleOpenFolder}
        onRefresh={handleRefresh}
        onCopyReview={handleCopyReview}
      />
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
            <div className="flex flex-1 items-center justify-center">
              <p className="text-gray-500">Select a file to view its diff</p>
            </div>
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
