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

type SidebarItem =
  | { kind: 'header'; label: string }
  | { kind: 'file'; file: DiffFile }

interface SidebarProps {
  onRefreshDiff: () => Promise<void>
}

export default function Sidebar({ onRefreshDiff }: SidebarProps): React.ReactElement {
  const rootPath = useRepoStore((state) => state.rootPath)
  const files = useRepoStore((state) => state.files)
  const selectedFile = useRepoStore((state) => state.selectedFile)
  const setSelectedFile = useRepoStore((state) => state.setSelectedFile)

  const [filter, setFilter] = useState('')

  const lowerFilter = filter.toLowerCase()

  const stagedFiles = useMemo(
    () => files.filter((f) => f.staged && f.filePath.toLowerCase().includes(lowerFilter)),
    [files, lowerFilter]
  )

  const unstagedFiles = useMemo(
    () => files.filter((f) => !f.staged && f.filePath.toLowerCase().includes(lowerFilter)),
    [files, lowerFilter]
  )

  const items: SidebarItem[] = useMemo(() => {
    const result: SidebarItem[] = []
    result.push({ kind: 'header', label: `Staged (${stagedFiles.length})` })
    for (const f of stagedFiles) result.push({ kind: 'file', file: f })
    result.push({ kind: 'header', label: `Unstaged (${unstagedFiles.length})` })
    for (const f of unstagedFiles) result.push({ kind: 'file', file: f })
    return result
  }, [stagedFiles, unstagedFiles])

  const itemsRef = useRef<SidebarItem[]>([])
  itemsRef.current = items

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(
      (i: number) => (itemsRef.current[i]?.kind === 'header' ? 28 : 36),
      []
    ),
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
    <div className="flex w-64 shrink-0 flex-col border-r border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Files</span>
        <div className="flex gap-1">
          <button
            onClick={handleStageAll}
            className="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-gray-100"
            title="Stage All"
          >
            Stage All
          </button>
          <button
            onClick={handleUnstageAll}
            className="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-gray-100"
            title="Unstage All"
          >
            Unstage All
          </button>
        </div>
      </div>

      {/* Filter input */}
      <div className="border-b border-gray-800 px-3 py-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter files..."
          className="w-full rounded bg-gray-800 px-2 py-1 text-xs text-gray-100 placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
        />
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
            const item = items[virtualItem.index]
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
                {item.kind === 'header' ? (
                  <div className="flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {item.label}
                  </div>
                ) : (
                  <FileRow
                    file={item.file}
                    isSelected={
                      selectedFile?.filePath === item.file.filePath &&
                      selectedFile?.staged === item.file.staged
                    }
                    onSelect={() => setSelectedFile(item.file)}
                    onToggleStage={handleToggleStage}
                  />
                )}
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
      className={`flex h-full cursor-pointer items-center gap-2 px-3 text-xs hover:bg-gray-800 ${
        isSelected ? 'bg-gray-800 text-gray-100' : 'text-gray-300'
      }`}
    >
      <input
        type="checkbox"
        checked={file.staged}
        onChange={() => {}}
        onClick={(e) => onToggleStage(file, e)}
        className="h-3 w-3 shrink-0 cursor-pointer accent-blue-500"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{name}</div>
        {dir && <div className="truncate text-gray-500">{dir}</div>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
        {file.additions > 0 && <span className="text-green-400">+{file.additions}</span>}
        {file.deletions > 0 && <span className="text-red-400">-{file.deletions}</span>}
      </div>
    </div>
  )
}
