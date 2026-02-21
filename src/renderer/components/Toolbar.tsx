import React, { useState, useCallback } from 'react'
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

function LinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.5 8.5a3.5 3.5 0 0 0 4.95 0l2-2a3.5 3.5 0 0 0-4.95-4.95l-1 1" />
      <path d="M8.5 5.5a3.5 3.5 0 0 0-4.95 0l-2 2a3.5 3.5 0 0 0 4.95 4.95l1-1" />
    </svg>
  )
}

const MCP_URL = 'http://127.0.0.1:27182/mcp'

export default function Toolbar({
  onOpenFolder,
  onRefresh,
  onCopyReview,
  hasComments,
}: ToolbarProps): React.ReactElement {
  const rootPath = useRepoStore((state) => state.rootPath)
  const isRepoLoaded = rootPath !== null
  const [mcpCopied, setMcpCopied] = useState(false)

  const handleCopyMcpUrl = useCallback(async () => {
    await window.electron.writeClipboard(MCP_URL)
    setMcpCopied(true)
    setTimeout(() => setMcpCopied(false), 1500)
  }, [])

  return (
    <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-line bg-base px-3">
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

      {/* MCP URL copy + repo path — right-aligned */}
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={handleCopyMcpUrl}
          title={`Copy MCP URL: ${MCP_URL}`}
          className="flex items-center gap-1.5 rounded border border-line px-2.5 py-1 font-mono text-[11px] text-ink-ghost transition-all hover:bg-overlay hover:text-ink"
        >
          <LinkIcon />
          {mcpCopied ? 'copied!' : 'mcp url'}
        </button>

        {rootPath && (
          <span className="truncate font-mono text-[10px] text-ink-ghost" style={{ maxWidth: 320 }}>
            {rootPath}
          </span>
        )}
      </div>
    </div>
  )
}
