import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRepoStore } from '../store/repo'
import { useCommentsStore } from '../store/comments'
import { DiffLine as DiffLineType } from '../../shared/types'
import DiffLineComponent from './DiffLine'
import { useHighlighter } from '../hooks/useHighlighter'

const ROW_HEIGHT = 22

export default function DiffView(): React.ReactElement {
  const selectedFile = useRepoStore((state) => state.selectedFile)
  const comments = useCommentsStore((state) => state.comments)
  const addComment = useCommentsStore((state) => state.addComment)
  const [openCommentIndex, setOpenCommentIndex] = useState<number | null>(null)

  // Reset open comment box when selected file changes
  useEffect(() => {
    setOpenCommentIndex(null)
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

  if (!selectedFile || selectedFile.hunks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">No changes</p>
      </div>
    )
  }

  const filePath = selectedFile.filePath

  return (
    <div ref={parentRef} className="flex-1 overflow-x-auto overflow-y-auto bg-gray-950">
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
          const hasComment = !!comments[`${filePath}:${line.lineNumber}`]
          const isCommentOpen = openCommentIndex === lineIndex

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
                isCommentOpen={isCommentOpen}
                onOpenComment={handleOpenComment}
                onCloseComment={handleCloseComment}
                onAddComment={handleAddComment}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
