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
    <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-line bg-elevated px-3">
      {/* Brand */}
      <div className="mr-2 flex items-center gap-1.5">
        <div className="h-3 w-3 shrink-0 rotate-45 rounded-[2px] bg-accent" />
        <span className="font-mono text-[11px] font-semibold text-ink-dim" style={{ letterSpacing: '0.01em' }}>
          openreview
        </span>
      </div>

      <div className="mx-1.5 h-3 w-px bg-line" />

      {/* Primary action */}
      <button
        onClick={onOpenFolder}
        className="flex items-center gap-1.5 rounded bg-accent px-2.5 py-1 font-mono text-[11px] font-semibold text-white transition-all hover:bg-accent-hi active:scale-95"
      >
        <FolderIcon />
        open
      </button>

      <button
        onClick={onRefresh}
        disabled={!isRepoLoaded}
        title="Refresh (⌘R)"
        className="flex items-center gap-1.5 rounded border border-line px-2.5 py-1 font-mono text-[11px] text-ink-dim transition-all hover:bg-overlay hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
      >
        <RefreshIcon />
        refresh
      </button>

      <button
        onClick={onCopyReview}
        disabled={!hasComments}
        className="flex items-center gap-1.5 rounded border border-line px-2.5 py-1 font-mono text-[11px] text-ink-dim transition-all hover:bg-overlay hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
      >
        <CopyIcon />
        copy review
      </button>

      {/* Repo path */}
      {rootPath && (
        <div className="ml-auto flex items-center gap-1 overflow-hidden">
          <span className="truncate font-mono text-[10px] text-ink-ghost" style={{ maxWidth: 320 }}>
            {rootPath}
          </span>
        </div>
      )}
    </div>
  )
}
