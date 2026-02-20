import React from 'react'
import { DiffLine as DiffLineType } from '../../shared/types'

interface DiffLineProps {
  line: DiffLineType
  highlightHtml?: string
}

const DiffLineComponent = React.memo(function DiffLineComponent({
  line,
  highlightHtml,
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

  // Separate the diff marker (+/-/space) from the code content
  const marker = line.content[0] ?? ' '
  const codeContent = line.content.slice(1)

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
      {/* Diff marker */}
      <div className={`w-4 shrink-0 select-none ${textClass}`}>{marker}</div>
      {/* Content: highlighted HTML or plain text fallback */}
      {highlightHtml ? (
        <div
          className="flex-1 overflow-hidden whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlightHtml }}
        />
      ) : (
        <div className={`flex-1 overflow-hidden whitespace-pre ${textClass}`}>
          {codeContent}
        </div>
      )}
    </div>
  )
})

export default DiffLineComponent
