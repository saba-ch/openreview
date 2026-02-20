import React, { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRepoStore } from '../store/repo'
import { DiffLine as DiffLineType } from '../../shared/types'
import DiffLineComponent from './DiffLine'

const ROW_HEIGHT = 22

export default function DiffView(): React.ReactElement {
  const selectedFile = useRepoStore((state) => state.selectedFile)

  const lines: DiffLineType[] = useMemo(() => {
    if (!selectedFile) return []
    return selectedFile.hunks.flatMap((hunk) => hunk.lines)
  }, [selectedFile])

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
  })

  if (!selectedFile || selectedFile.hunks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">No changes</p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-x-auto overflow-y-auto bg-gray-950">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const line = lines[virtualItem.index]
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
              <DiffLineComponent line={line} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
