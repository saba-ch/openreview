import React, { useRef, useEffect, useState } from 'react'

interface CommentBoxProps {
  initialText?: string
  onSubmit: (text: string) => void
  onCancel: () => void
}

const CommentBox = React.memo(function CommentBox({
  initialText,
  onSubmit,
  onCancel,
}: CommentBoxProps): React.ReactElement {
  const [text, setText] = useState(initialText ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <div
      className="mx-2 mb-2 rounded-lg border border-line bg-surface p-3"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px var(--color-border-subtle)' }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Add a comment…"
        className="w-full resize-none rounded-md border border-line-subtle bg-elevated p-2.5 font-mono text-xs text-ink placeholder-ink-ghost outline-none transition-colors focus:border-accent"
        style={{ lineHeight: '1.6' }}
      />
      <div className="mt-2 flex gap-1.5">
        <button
          onClick={() => {
            if (text.trim()) onSubmit(text.trim())
          }}
          disabled={!text.trim()}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-accent-hi active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        >
          Comment
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-dim transition-colors hover:bg-elevated hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  )
})

export default CommentBox
