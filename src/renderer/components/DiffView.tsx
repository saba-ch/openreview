import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRepoStore } from '../store/repo'
import { useCommentsStore } from '../store/comments'
import { DiffFile, DiffLine as DiffLineType } from '../../shared/types'
import DiffLineComponent from './DiffLine'

function parseHunkRange(header: string): { oldStart: number; oldCount: number } | null {
  const m = header.match(/@@ -(\d+)(?:,(\d+))?/)
  if (!m) return null
  return { oldStart: parseInt(m[1]), oldCount: parseInt(m[2] ?? '1') }
}

type ViewItem =
  | { kind: 'file-header'; file: DiffFile; fileKey: string; isCollapsed: boolean }
  | {
      kind: 'line'
      line: DiffLineType
      file: DiffFile
      fileLineIndex: number
      unmodifiedCount?: number
    }

export default function DiffView(): React.ReactElement {
  const files = useRepoStore((state) => state.files)
  const selectedFile = useRepoStore((state) => state.selectedFile)
  const comments = useCommentsStore((state) => state.comments)
  const addComment = useCommentsStore((state) => state.addComment)
  const updateComment = useCommentsStore((state) => state.updateComment)
  const deleteComment = useCommentsStore((state) => state.deleteComment)

  const [openCommentKey, setOpenCommentKey] = useState<string | null>(null)
  const [editCommentKey, setEditCommentKey] = useState<string | null>(null)
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set())

  const parentRef = useRef<HTMLDivElement>(null)

  const toggleCollapse = useCallback((fileKey: string) => {
    setCollapsedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(fileKey)) next.delete(fileKey)
      else next.add(fileKey)
      return next
    })
  }, [])

  // Flatten all files into a single virtual list
  const items = useMemo((): ViewItem[] => {
    const result: ViewItem[] = []
    for (const file of files) {
      if (file.hunks.length === 0) continue
      const fileKey = `${file.filePath}:${file.staged}`
      const isCollapsed = collapsedFiles.has(fileKey)
      result.push({ kind: 'file-header', file, fileKey, isCollapsed })

      if (isCollapsed) continue

      // Compute unmodified gap counts per hunk boundary
      const unmodifiedCounts = new Map<number, number>()
      let localIdx = 0
      for (let i = 0; i < file.hunks.length; i++) {
        if (i > 0) {
          const prev = parseHunkRange(file.hunks[i - 1].header)
          const curr = parseHunkRange(file.hunks[i].header)
          if (prev && curr) {
            const gap = curr.oldStart - (prev.oldStart + prev.oldCount)
            if (gap > 0) unmodifiedCounts.set(localIdx, gap)
          }
        }
        localIdx += file.hunks[i].lines.length
      }

      const allLines = file.hunks.flatMap((h) => h.lines)
      for (let i = 0; i < allLines.length; i++) {
        result.push({
          kind: 'line',
          line: allLines[i],
          file,
          fileLineIndex: i,
          unmodifiedCount: unmodifiedCounts.get(i),
        })
      }
    }
    return result
  }, [files, collapsedFiles])

  const itemsRef = useRef<ViewItem[]>([])
  itemsRef.current = items

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((i: number) => {
      const item = itemsRef.current[i]
      if (!item || item.kind !== 'file-header') return 20
      return i === 0 ? 40 : 52
    }, []),
    measureElement: (el) => el.getBoundingClientRect().height,
  })

  const virtualizerRef = useRef(virtualizer)
  virtualizerRef.current = virtualizer

  // Scroll to selected file when sidebar selection changes
  useEffect(() => {
    if (!selectedFile) return
    const idx = items.findIndex(
      (item) =>
        item.kind === 'file-header' &&
        item.file.filePath === selectedFile.filePath &&
        item.file.staged === selectedFile.staged,
    )
    if (idx >= 0) {
      virtualizerRef.current.scrollToIndex(idx, { align: 'start' })
    }
  }, [selectedFile, items])

  const handleAddComment = useCallback(
    (filePath: string, lineNumber: number, text: string) => {
      addComment({ id: crypto.randomUUID(), filePath, lineNumber, text, outdated: false })
      setOpenCommentKey(null)
    },
    [addComment],
  )

  const handleUpdateComment = useCallback(
    (id: string, text: string) => {
      updateComment(id, text)
      setEditCommentKey(null)
    },
    [updateComment],
  )

  const handleDeleteComment = useCallback((id: string) => deleteComment(id), [deleteComment])

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-[11px] text-ink-ghost">no changes</p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-x-auto overflow-y-auto bg-base">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          let content: React.ReactNode

          if (item.kind === 'file-header') {
            content = (
              <FileHeaderRow
                file={item.file}
                isFirst={virtualItem.index === 0}
                isCollapsed={item.isCollapsed}
                onToggle={() => toggleCollapse(item.fileKey)}
              />
            )
          } else {
            const { line, file, fileLineIndex, unmodifiedCount } = item
            const itemKey = `${file.filePath}:${fileLineIndex}`
            const comment = comments[`${file.filePath}:${line.lineNumber}`]
            content = (
              <DiffLineComponent
                line={line}
                lineIndex={fileLineIndex}
                filePath={file.filePath}
                highlightHtml={undefined}
                hasComment={!!comment}
                comment={comment}
                isCommentOpen={openCommentKey === itemKey}
                isEditOpen={editCommentKey === itemKey}
                onOpenComment={() => setOpenCommentKey(itemKey)}
                onCloseComment={() => setOpenCommentKey(null)}
                onAddComment={handleAddComment}
                onEditComment={() => setEditCommentKey(itemKey)}
                onCancelEdit={() => setEditCommentKey(null)}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                unmodifiedCount={unmodifiedCount}
              />
            )
          }

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FileHeaderRow({
  file,
  isFirst,
  isCollapsed,
  onToggle,
}: {
  file: DiffFile
  isFirst: boolean
  isCollapsed: boolean
  onToggle: () => void
}): React.ReactElement {
  return (
    <div style={{ paddingTop: isFirst ? 0 : 12 }}>
      <div
        className="flex cursor-pointer items-center border-b border-t border-line bg-elevated px-4 hover:bg-overlay"
        style={{ height: 40 }}
        onClick={onToggle}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 shrink-0 text-ink-ghost transition-transform duration-150"
          style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
        <span className="font-mono text-[11px] text-ink">{file.filePath}</span>
        {file.additions > 0 && (
          <span className="ml-3 font-mono text-[11px] text-diff-add-fg">+{file.additions}</span>
        )}
        {file.deletions > 0 && (
          <span className="ml-1 font-mono text-[11px] text-diff-remove-fg">
            -{file.deletions}
          </span>
        )}
      </div>
    </div>
  )
}
