import React from 'react'
import { DiffLine as DiffLineType, Comment } from '../../shared/types'
import CommentBox from './CommentBox'

interface DiffLineProps {
  line: DiffLineType
  lineIndex: number
  filePath: string
  highlightHtml?: string
  hasComment: boolean
  comment?: Comment
  isCommentOpen: boolean
  isEditOpen: boolean
  onOpenComment: (lineIndex: number) => void
  onCloseComment: () => void
  onAddComment: (filePath: string, lineNumber: number, text: string) => void
  onEditComment: (lineIndex: number) => void
  onCancelEdit: () => void
  onUpdateComment: (id: string, text: string) => void
  onDeleteComment: (id: string) => void
}

const DiffLineComponent = React.memo(function DiffLineComponent({
  line,
  lineIndex,
  filePath,
  highlightHtml,
  hasComment,
  comment,
  isCommentOpen,
  isEditOpen,
  onOpenComment,
  onCloseComment,
  onAddComment,
  onEditComment,
  onCancelEdit,
  onUpdateComment,
  onDeleteComment,
}: DiffLineProps): React.ReactElement {
  if (line.type === 'hunk-header') {
    return (
      <div
        className="flex items-center bg-gray-800 px-4 font-mono text-xs text-gray-400"
        style={{ minHeight: 22 }}
      >
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
    <div className={`font-mono text-xs ${bgClass}`}>
      {/* Main line row */}
      <div className="group flex items-center" style={{ minHeight: 22 }}>
        {/* Old line number */}
        <div className="w-12 shrink-0 select-none pr-2 text-right font-mono text-gray-600">
          {line.oldLineNumber ?? ''}
        </div>
        {/* New line number */}
        <div className="w-12 shrink-0 select-none pr-2 text-right font-mono text-gray-600">
          {line.newLineNumber ?? ''}
        </div>
        {/* Gutter: '+' button or speech-bubble icon */}
        <div className="flex w-6 shrink-0 select-none items-center justify-center">
          {hasComment ? (
            <span className="text-[10px] text-blue-400" title="Has comment">
              💬
            </span>
          ) : (
            <button
              className="invisible flex h-4 w-4 items-center justify-center rounded text-xs leading-none text-gray-500 hover:bg-gray-700 hover:text-gray-200 group-hover:visible"
              onClick={() => onOpenComment(lineIndex)}
              title="Add comment"
            >
              +
            </button>
          )}
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
      {/* Inline comment display (always visible when comment exists and not editing) */}
      {comment && !isEditOpen && (
        <div
          className={`m-1 rounded border p-2 text-xs ${
            comment.outdated
              ? 'border-amber-500 bg-amber-950/30'
              : 'border-gray-700 bg-gray-900'
          }`}
        >
          {comment.outdated && (
            <span className="mb-1 block font-sans text-xs font-medium text-amber-400">
              Outdated
            </span>
          )}
          <p className="whitespace-pre-wrap font-mono text-gray-200">{comment.text}</p>
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => onEditComment(lineIndex)}
              className="rounded bg-gray-700 px-3 py-1 text-xs text-gray-200 hover:bg-gray-600"
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteComment(comment.id)}
              className="rounded bg-red-900/50 px-3 py-1 text-xs text-red-300 hover:bg-red-900"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      {/* CommentBox for editing an existing comment */}
      {comment && isEditOpen && (
        <CommentBox
          initialText={comment.text}
          onSubmit={(text) => onUpdateComment(comment.id, text)}
          onCancel={onCancelEdit}
        />
      )}
      {/* CommentBox for adding a new comment */}
      {!comment && isCommentOpen && (
        <CommentBox
          onSubmit={(text) => onAddComment(filePath, line.lineNumber, text)}
          onCancel={onCloseComment}
        />
      )}
    </div>
  )
})

export default DiffLineComponent
