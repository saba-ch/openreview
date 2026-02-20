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
  unmodifiedCount?: number
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
  unmodifiedCount,
}: DiffLineProps): React.ReactElement {
  if (line.type === 'hunk-header') {
    return (
      <div
        className="flex items-center bg-diff-hunk px-4 font-mono text-[11px] text-diff-hunk-fg"
        style={{ minHeight: 20, borderTop: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1.5 shrink-0"
        >
          <path d="M2 4l3-3 3 3M5 1v8" />
        </svg>
        {unmodifiedCount != null
          ? `${unmodifiedCount} unmodified lines`
          : line.content}
      </div>
    )
  }

  const isAdded = line.type === 'added'
  const isRemoved = line.type === 'removed'

  const bgClass = isAdded ? 'bg-diff-add' : isRemoved ? 'bg-diff-remove' : ''
  const textClass = isAdded
    ? 'text-diff-add-fg'
    : isRemoved
      ? 'text-diff-remove-fg'
      : 'text-ink'

  const codeContent = line.content.slice(1)

  return (
    <div
      className={`font-mono text-[11px] ${bgClass}`}
      style={{
        borderLeft: isAdded
          ? '3px solid var(--color-added-border)'
          : isRemoved
            ? '3px solid var(--color-removed-border)'
            : '3px solid transparent',
      }}
    >
      {/* Main line row */}
      <div className="group flex items-center" style={{ minHeight: 20 }}>
        {/* Old line number */}
        <div className="w-8 shrink-0 select-none pr-1.5 text-right font-mono text-[10px] text-ink-ghost">
          {line.oldLineNumber ?? ''}
        </div>
        {/* New line number */}
        <div className="w-8 shrink-0 select-none pr-1.5 text-right font-mono text-[10px] text-ink-ghost">
          {line.newLineNumber ?? ''}
        </div>
        {/* Gutter: comment button or indicator */}
        <div className="flex w-7 shrink-0 select-none items-center justify-center">
          {hasComment ? (
            <span
              className="text-[9px] text-accent opacity-90"
              title="Has comment"
              style={{ lineHeight: 1 }}
            >
              ●
            </span>
          ) : (
            <button
              className="invisible flex h-4 w-4 items-center justify-center rounded text-[11px] leading-none text-ink-ghost transition-colors hover:bg-overlay hover:text-ink group-hover:visible"
              onClick={() => onOpenComment(lineIndex)}
              title="Add comment"
            >
              +
            </button>
          )}
        </div>
        {/* Content */}
        {highlightHtml ? (
          <div
            className="flex-1 overflow-hidden whitespace-pre px-1"
            dangerouslySetInnerHTML={{ __html: highlightHtml }}
          />
        ) : (
          <div className={`flex-1 overflow-hidden whitespace-pre px-1 ${textClass}`}>
            {codeContent}
          </div>
        )}
      </div>

      {/* Inline comment display */}
      {comment && !isEditOpen && (
        <div
          className={`mx-2 mb-1.5 rounded-lg border p-3 text-xs ${
            comment.outdated
              ? 'border-amber-800/60 bg-amber-950/20'
              : 'border-line bg-surface'
          }`}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
        >
          {comment.outdated && (
            <span className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-wide text-amber-400/80">
              Outdated
            </span>
          )}
          <p className="whitespace-pre-wrap font-mono text-[11px] text-ink leading-relaxed">
            {comment.text}
          </p>
          <div className="mt-2.5 flex gap-1.5">
            <button
              onClick={() => onEditComment(lineIndex)}
              className="rounded-md border border-line bg-elevated px-2.5 py-1 text-[11px] font-medium text-ink-dim transition-colors hover:bg-overlay hover:text-ink"
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteComment(comment.id)}
              className="rounded-md border border-red-900/50 bg-red-950/30 px-2.5 py-1 text-[11px] font-medium text-red-400/80 transition-colors hover:bg-red-950/60 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* CommentBox for editing */}
      {comment && isEditOpen && (
        <CommentBox
          initialText={comment.text}
          onSubmit={(text) => onUpdateComment(comment.id, text)}
          onCancel={onCancelEdit}
        />
      )}

      {/* CommentBox for adding */}
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
