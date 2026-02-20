import React from 'react'
import { useRepoStore } from '../store/repo'

interface ToolbarProps {
  onOpenFolder: () => void
  onRefresh: () => void
  onCopyReview: () => void
  hasComments: boolean
}

function FolderIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 3.5h4l1.5 1.5h5.5a.5.5 0 0 1 .5.5V10a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.5 7A5.5 5.5 0 0 1 2.5 11" />
      <path d="M1.5 7A5.5 5.5 0 0 1 11.5 3" />
      <path d="M11 1l.5 2-2 .5" />
      <path d="M3 13l-.5-2 2-.5" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="4.5" width="8" height="8" rx="1" />
      <path d="M9.5 4.5V3a.5.5 0 0 0-.5-.5H2.5a.5.5 0 0 0-.5.5v6.5a.5.5 0 0 0 .5.5H4" />
    </svg>
  )
}

export default function Toolbar({
  onOpenFolder,
  onRefresh,
  onCopyReview,
  hasComments,
}: ToolbarProps): React.ReactElement {
  const rootPath = useRepoStore((state) => state.rootPath)
  const isRepoLoaded = rootPath !== null

  return (
    <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-line bg-surface px-4">
      {/* Brand */}
      <div className="mr-2.5 flex items-center gap-2">
        <div
          className="h-4 w-4 shrink-0 rotate-45 rounded-sm bg-accent"
          style={{ boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}
        />
        <span
          className="text-sm font-semibold text-ink"
          style={{ letterSpacing: '-0.025em' }}
        >
          OpenReview
        </span>
      </div>

      <div className="mx-2 h-4 w-px bg-line-subtle" />

      {/* Primary action */}
      <button
        onClick={onOpenFolder}
        className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-accent-hi active:scale-95"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      >
        <FolderIcon />
        Open
      </button>

      <button
        onClick={onRefresh}
        disabled={!isRepoLoaded}
        title="Refresh (⌘R)"
        className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-dim transition-all hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
      >
        <RefreshIcon />
        Refresh
      </button>

      <button
        onClick={onCopyReview}
        disabled={!hasComments}
        className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-dim transition-all hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
      >
        <CopyIcon />
        Copy Review
      </button>

      {/* Repo path pill */}
      {rootPath && (
        <div className="ml-auto flex items-center gap-1.5 rounded border border-line-subtle bg-elevated px-2.5 py-1">
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-ink-ghost"
          >
            <path d="M1 3h3.5l1.5 1.5H11a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5H1a.5.5 0 0 1-.5-.5V3.5A.5.5 0 0 1 1 3Z" />
          </svg>
          <span className="max-w-xs truncate font-mono text-[10px] text-ink-ghost">
            {rootPath}
          </span>
        </div>
      )}
    </div>
  )
}
