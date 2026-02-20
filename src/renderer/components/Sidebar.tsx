import React, { useState, useRef, useMemo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRepoStore } from '../store/repo'
import { DiffFile } from '../../shared/types'

function basename(filePath: string): string {
  return filePath.split('/').pop() ?? filePath
}

function dirname(filePath: string): string {
  const parts = filePath.split('/')
  if (parts.length <= 1) return ''
  return parts.slice(0, -1).join('/')
}

interface SidebarProps {
  onRefreshDiff: () => Promise<void>
}

export default function Sidebar({ onRefreshDiff }: SidebarProps): React.ReactElement {
  const rootPath = useRepoStore((state) => state.rootPath)
  const files = useRepoStore((state) => state.files)
  const selectedFile = useRepoStore((state) => state.selectedFile)
  const setSelectedFile = useRepoStore((state) => state.setSelectedFile)

  const [filter, setFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'unstaged' | 'staged'>('unstaged')

  const lowerFilter = filter.toLowerCase()

  const stagedFiles = useMemo(
    () => files.filter((f) => f.staged && f.filePath.toLowerCase().includes(lowerFilter)),
    [files, lowerFilter]
  )

  const unstagedFiles = useMemo(
    () => files.filter((f) => !f.staged && f.filePath.toLowerCase().includes(lowerFilter)),
    [files, lowerFilter]
  )

  const activeFiles = activeTab === 'staged' ? stagedFiles : unstagedFiles

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: activeFiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 30, []),
  })

  const handleToggleStage = useCallback(
    async (file: DiffFile, e: React.MouseEvent) => {
      e.stopPropagation()
      if (!rootPath) return
      if (file.staged) {
        await window.electron.unstageFile(rootPath, file.filePath)
      } else {
        await window.electron.stageFile(rootPath, file.filePath)
      }
      await onRefreshDiff()
    },
    [rootPath, onRefreshDiff]
  )

  const handleStageAll = useCallback(async () => {
    if (!rootPath) return
    for (const f of unstagedFiles) {
      await window.electron.stageFile(rootPath, f.filePath)
    }
    await onRefreshDiff()
  }, [rootPath, unstagedFiles, onRefreshDiff])

  const handleUnstageAll = useCallback(async () => {
    if (!rootPath) return
    for (const f of stagedFiles) {
      await window.electron.unstageFile(rootPath, f.filePath)
    }
    await onRefreshDiff()
  }, [rootPath, stagedFiles, onRefreshDiff])

  return (
    <div className="flex w-60 shrink-0 flex-col border-r border-line bg-elevated">
      {/* Tab bar */}
      <div className="flex shrink-0 items-stretch border-b border-line" style={{ minHeight: 34 }}>
        <button
          onClick={() => setActiveTab('unstaged')}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 font-mono text-[11px] transition-colors ${
            activeTab === 'unstaged'
              ? 'border-b-2 border-accent text-ink'
              : 'text-ink-ghost hover:text-ink-dim'
          }`}
        >
          Unstaged
          <span className="font-mono text-[10px] tabular-nums text-ink-ghost">
            {unstagedFiles.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('staged')}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 font-mono text-[11px] transition-colors ${
            activeTab === 'staged'
              ? 'border-b-2 border-accent text-ink'
              : 'text-ink-ghost hover:text-ink-dim'
          }`}
        >
          Staged
          <span className="font-mono text-[10px] tabular-nums text-ink-ghost">
            {stagedFiles.length}
          </span>
        </button>
        {/* Stage / unstage all button */}
        <div className="flex items-center pr-1.5">
          {activeTab === 'unstaged' ? (
            <button
              onClick={handleStageAll}
              className="rounded px-1.5 py-0.5 font-mono text-[9px] text-ink-ghost transition-colors hover:bg-overlay hover:text-ink-dim"
              title="Stage All"
            >
              +all
            </button>
          ) : (
            <button
              onClick={handleUnstageAll}
              className="rounded px-1.5 py-0.5 font-mono text-[9px] text-ink-ghost transition-colors hover:bg-overlay hover:text-ink-dim"
              title="Unstage All"
            >
              -all
            </button>
          )}
        </div>
      </div>

      {/* Filter input */}
      <div className="border-b border-line px-2 py-1.5">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-ghost"
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="5" cy="5" r="3.5" />
            <path d="M8 8l2.5 2.5" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files…"
            className="w-full rounded-md border border-line-subtle bg-surface py-1 pl-6 pr-2 text-xs text-ink placeholder-ink-ghost outline-none transition-colors focus:border-accent focus:ring-0"
          />
        </div>
      </div>

      {/* Virtual list */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const file = activeFiles[virtualItem.index]
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <FileRow
                  file={file}
                  isSelected={
                    selectedFile?.filePath === file.filePath &&
                    selectedFile?.staged === file.staged
                  }
                  onSelect={() => setSelectedFile(file)}
                  onToggleStage={handleToggleStage}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface FileRowProps {
  file: DiffFile
  isSelected: boolean
  onSelect: () => void
  onToggleStage: (file: DiffFile, e: React.MouseEvent) => void
}

function FileRow({ file, isSelected, onSelect, onToggleStage }: FileRowProps): React.ReactElement {
  const name = basename(file.filePath)
  const dir = dirname(file.filePath)

  return (
    <div
      onClick={onSelect}
      className={`flex h-full cursor-pointer items-center gap-1.5 border-l-2 px-2 transition-colors ${
        isSelected
          ? 'border-accent bg-overlay text-ink'
          : 'border-transparent hover:bg-overlay text-ink-dim'
      }`}
    >
      <input
        type="checkbox"
        checked={file.staged}
        onChange={() => {}}
        onClick={(e) => onToggleStage(file, e)}
        className="h-3 w-3 shrink-0 cursor-pointer accent-accent"
      />
      <div className="min-w-0 flex-1">
        <div className={`truncate font-mono text-[11px] ${isSelected ? 'text-ink' : 'text-ink-dim'}`}>
          {name}
        </div>
        {dir && (
          <div className="truncate font-mono text-[9px] text-ink-ghost">{dir}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 font-mono text-[9px]">
        {file.additions > 0 && (
          <span className="text-diff-add-fg">+{file.additions}</span>
        )}
        {file.deletions > 0 && (
          <span className="text-diff-remove-fg">-{file.deletions}</span>
        )}
      </div>
    </div>
  )
}
