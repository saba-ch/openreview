import React from 'react'
import { useRepoStore } from '../store/repo'

interface ToolbarProps {
  onOpenFolder: () => void
  onRefresh: () => void
  onCopyReview: () => void
}

export default function Toolbar({ onOpenFolder, onRefresh, onCopyReview }: ToolbarProps): React.ReactElement {
  const rootPath = useRepoStore((state) => state.rootPath)
  const isRepoLoaded = rootPath !== null

  return (
    <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-2">
      <span className="mr-4 text-lg font-bold tracking-tight text-gray-100">OpenReview</span>
      <button
        onClick={onOpenFolder}
        className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
      >
        Open Folder
      </button>
      <button
        onClick={onRefresh}
        disabled={!isRepoLoaded}
        className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Refresh
      </button>
      <button
        onClick={onCopyReview}
        disabled={!isRepoLoaded}
        className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Copy Review
      </button>
      {rootPath && (
        <span className="ml-4 truncate text-xs text-gray-500">{rootPath}</span>
      )}
    </div>
  )
}
