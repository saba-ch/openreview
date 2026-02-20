import { useEffect, useRef, useReducer } from 'react'
import type { DiffFile } from '../../shared/types'

function getLang(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    go: 'go',
    rs: 'rust',
    css: 'css',
    html: 'html',
    json: 'json',
    md: 'markdown',
    sh: 'bash',
    bash: 'bash',
    java: 'java',
    cpp: 'cpp',
    cc: 'cpp',
    c: 'c',
    h: 'c',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    cs: 'csharp',
  }
  return map[ext] ?? 'text'
}

export function useHighlighter(
  files: DiffFile[],
  visibleLineItems: Array<{ filePath: string; fileLineIndex: number }>,
): Map<string, Map<number, string>> {
  const workerRef = useRef<Worker | null>(null)
  // Cache keyed by filePath → Map<lineIndex, html>
  const cacheRef = useRef<Map<string, Map<number, string>>>(new Map())
  const pendingRef = useRef<Set<string>>(new Set())
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  // Create worker on mount
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/highlighter.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    worker.addEventListener(
      'message',
      (event: MessageEvent<{ id: string; html: string }>) => {
        const { id, html } = event.data
        pendingRef.current.delete(id)
        // id format: "${filePath}:${lineIndex}"
        const lastColon = id.lastIndexOf(':')
        const filePath = id.slice(0, lastColon)
        const lineIndex = parseInt(id.slice(lastColon + 1), 10)
        if (!cacheRef.current.has(filePath)) {
          cacheRef.current.set(filePath, new Map())
        }
        cacheRef.current.get(filePath)!.set(lineIndex, html)
        forceUpdate()
      },
    )

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  // Send visible lines to worker for highlighting
  useEffect(() => {
    if (!workerRef.current || visibleLineItems.length === 0) return

    const worker = workerRef.current
    const fileMap = new Map(
      files.map((f) => [
        f.filePath,
        { allLines: f.hunks.flatMap((h) => h.lines), lang: getLang(f.filePath) },
      ]),
    )

    for (const { filePath, fileLineIndex } of visibleLineItems) {
      const cacheKey = `${filePath}:${fileLineIndex}`
      if (
        cacheRef.current.get(filePath)?.has(fileLineIndex) ||
        pendingRef.current.has(cacheKey)
      ) {
        continue
      }

      const fileInfo = fileMap.get(filePath)
      if (!fileInfo) continue

      const line = fileInfo.allLines[fileLineIndex]
      if (!line || line.type === 'hunk-header') continue

      pendingRef.current.add(cacheKey)
      worker.postMessage({ id: cacheKey, code: line.content.slice(1), lang: fileInfo.lang })
    }
  }, [files, visibleLineItems])

  return cacheRef.current
}
