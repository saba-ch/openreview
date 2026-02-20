import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRepoStore } from '../store/repo'
import { useCommentsStore } from '../store/comments'
import { DiffLine as DiffLineType } from '../../shared/types'
import DiffLineComponent from './DiffLine'
import { useHighlighter } from '../hooks/useHighlighter'

const ROW_HEIGHT = 20

export default function DiffView(): React.ReactElement {
  const selectedFile = useRepoStore((state) => state.selectedFile)
  const comments = useCommentsStore((state) => state.comments)
  const addComment = useCommentsStore((state) => state.addComment)
  const updateComment = useCommentsStore((state) => state.updateComment)
  const deleteComment = useCommentsStore((state) => state.deleteComment)
  const [openCommentIndex, setOpenCommentIndex] = useState<number | null>(null)
  const [editCommentIndex, setEditCommentIndex] = useState<number | null>(null)

  // Reset open/edit state when selected file changes
  useEffect(() => {
    setOpenCommentIndex(null)
    setEditCommentIndex(null)
  }, [selectedFile])

  const lines: DiffLineType[] = useMemo(() => {
    if (!selectedFile) return []
    return selectedFile.hunks.flatMap((hunk) => hunk.lines)
  }, [selectedFile])

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    measureElement: (el) => el.getBoundingClientRect().height,
  })

  // Compute visible range for the highlighter hook
  const virtualItems = virtualizer.getVirtualItems()
  const visibleStart = virtualItems.length > 0 ? virtualItems[0].index : 0
  const visibleEnd =
    virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : 0

  const highlights = useHighlighter(lines, selectedFile, visibleStart, visibleEnd)

  const handleOpenComment = useCallback((lineIndex: number) => {
    setOpenCommentIndex(lineIndex)
  }, [])

  const handleCloseComment = useCallback(() => {
    setOpenCommentIndex(null)
  }, [])

  const handleAddComment = useCallback(
    (filePath: string, lineNumber: number, text: string) => {
      addComment({
        id: crypto.randomUUID(),
        filePath,
        lineNumber,
        text,
        outdated: false,
      })
      setOpenCommentIndex(null)
    },
    [addComment],
  )

  const handleEditComment = useCallback((lineIndex: number) => {
    setEditCommentIndex(lineIndex)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditCommentIndex(null)
  }, [])

  const handleUpdateComment = useCallback(
    (id: string, text: string) => {
      updateComment(id, text)
      setEditCommentIndex(null)
    },
    [updateComment],
  )

  const handleDeleteComment = useCallback(
    (id: string) => {
      deleteComment(id)
    },
    [deleteComment],
  )

  if (!selectedFile || selectedFile.hunks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-[11px] text-ink-ghost">no changes</p>
      </div>
    )
  }

  const filePath = selectedFile.filePath

  return (
    <div ref={parentRef} className="flex-1 overflow-x-auto overflow-y-auto bg-base">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const line = lines[virtualItem.index]
          const lineIndex = virtualItem.index
          const comment = comments[`${filePath}:${line.lineNumber}`]
          const hasComment = !!comment
          const isCommentOpen = openCommentIndex === lineIndex
          const isEditOpen = editCommentIndex === lineIndex

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
              <DiffLineComponent
                line={line}
                lineIndex={lineIndex}
                filePath={filePath}
                highlightHtml={highlights.get(virtualItem.index)}
                hasComment={hasComment}
                comment={comment}
                isCommentOpen={isCommentOpen}
                isEditOpen={isEditOpen}
                onOpenComment={handleOpenComment}
                onCloseComment={handleCloseComment}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onCancelEdit={handleCancelEdit}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
