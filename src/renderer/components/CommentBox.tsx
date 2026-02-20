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
    <div className="m-1 rounded border border-gray-700 bg-gray-900 p-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Add a comment..."
        className="w-full resize-none rounded border border-gray-600 bg-gray-800 p-2 font-mono text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
      />
      <div className="mt-1 flex gap-2">
        <button
          onClick={() => {
            if (text.trim()) onSubmit(text.trim())
          }}
          disabled={!text.trim()}
          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Comment
        </button>
        <button
          onClick={onCancel}
          className="rounded bg-gray-700 px-3 py-1 text-xs text-gray-200 hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )
})

export default CommentBox
