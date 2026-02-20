import React from 'react'
import { DiffLine as DiffLineType } from '../../shared/types'

interface DiffLineProps {
  line: DiffLineType
}

const DiffLineComponent = React.memo(function DiffLineComponent({
  line,
}: DiffLineProps): React.ReactElement {
  if (line.type === 'hunk-header') {
    return (
      <div className="flex h-full items-center bg-gray-800 px-4 font-mono text-xs text-gray-400">
        {line.content}
      </div>
    )
  }

  const bgClass =
    line.type === 'added'
      ? 'bg-green-950'
      : line.type === 'removed'
        ? 'bg-red-950'
        : ''

  const textClass =
    line.type === 'added'
      ? 'text-green-200'
      : line.type === 'removed'
        ? 'text-red-200'
        : 'text-gray-300'

  return (
    <div className={`flex h-full items-center font-mono text-xs ${bgClass}`}>
      {/* Old line number */}
      <div className="w-12 shrink-0 select-none pr-2 text-right font-mono text-gray-600">
        {line.oldLineNumber ?? ''}
      </div>
      {/* New line number */}
      <div className="w-12 shrink-0 select-none pr-2 text-right font-mono text-gray-600">
        {line.newLineNumber ?? ''}
      </div>
      {/* Content */}
      <div className={`flex-1 overflow-hidden pl-1 whitespace-pre ${textClass}`}>
        {line.content}
      </div>
    </div>
  )
})

export default DiffLineComponent
