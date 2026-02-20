/// <reference lib="WebWorker" />

import { createHighlighter, type Highlighter } from 'shiki'

let highlighter: Highlighter | null = null

const initPromise = createHighlighter({
  themes: ['github-dark'],
  langs: [
    'typescript',
    'tsx',
    'javascript',
    'jsx',
    'python',
    'go',
    'rust',
    'css',
    'html',
    'json',
    'markdown',
    'bash',
    'java',
    'cpp',
    'c',
    'yaml',
    'toml',
    'ruby',
    'php',
    'swift',
    'kotlin',
    'csharp',
  ],
}).then((h) => {
  highlighter = h
})

interface WorkerRequest {
  id: string
  code: string
  lang: string
}

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { id, code, lang } = event.data
  await initPromise

  let html = ''
  try {
    const raw = highlighter!.codeToHtml(code, { lang, theme: 'github-dark' })
    html = raw
      .replace(/^<pre[^>]*><code[^>]*>/, '')
      .replace(/<\/code><\/pre>\s*$/, '')
  } catch {
    try {
      const raw = highlighter!.codeToHtml(code, { lang: 'text', theme: 'github-dark' })
      html = raw
        .replace(/^<pre[^>]*><code[^>]*>/, '')
        .replace(/<\/code><\/pre>\s*$/, '')
    } catch {
      html = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }
  }

  self.postMessage({ id, html })
})
