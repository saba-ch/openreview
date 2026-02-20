import { spawn } from 'child_process'
import parseDiff from 'parse-diff'
import type { DiffFile, DiffHunk, DiffLine } from '../shared/types.js'

function runGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, { cwd })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString() })
    proc.on('close', (code: number | null) => {
      if (code !== 0 && code !== null) {
        reject(new Error(stderr || `git ${args[0]} exited with code ${code}`))
      } else {
        resolve(stdout)
      }
    })
    proc.on('error', (err: Error) => reject(err))
  })
}

function mapParsedFiles(files: ReturnType<typeof parseDiff>, staged: boolean): DiffFile[] {
  return files.map((file) => {
    const filePath = (file.to && file.to !== '/dev/null') ? file.to : (file.from ?? '')
    const oldFilePath = file.from ?? ''

    let lineCounter = 0
    const hunks: DiffHunk[] = file.chunks.map((chunk) => {
      const lines: DiffLine[] = []

      // Include hunk header as a DiffLine
      lines.push({
        lineNumber: lineCounter++,
        oldLineNumber: null,
        newLineNumber: null,
        type: 'hunk-header',
        content: chunk.content
      })

      for (const change of chunk.changes) {
        let type: DiffLine['type']
        let oldLineNumber: number | null
        let newLineNumber: number | null

        if (change.type === 'add') {
          type = 'added'
          oldLineNumber = null
          newLineNumber = change.ln
        } else if (change.type === 'del') {
          type = 'removed'
          oldLineNumber = change.ln
          newLineNumber = null
        } else {
          type = 'context'
          oldLineNumber = change.ln1
          newLineNumber = change.ln2
        }

        lines.push({
          lineNumber: lineCounter++,
          oldLineNumber,
          newLineNumber,
          type,
          content: change.content
        })
      }

      return { header: chunk.content, lines }
    })

    return {
      filePath,
      oldFilePath,
      hunks,
      additions: file.additions,
      deletions: file.deletions,
      staged
    }
  })
}

export async function getRepoDiff(rootPath: string): Promise<DiffFile[]> {
  const [stagedText, unstagedText] = await Promise.all([
    runGit(['diff', '--cached'], rootPath),
    runGit(['diff'], rootPath)
  ])

  const stagedFiles = mapParsedFiles(parseDiff(stagedText), true)
  const unstagedFiles = mapParsedFiles(parseDiff(unstagedText), false)

  return [...stagedFiles, ...unstagedFiles]
}

export async function stageFile(rootPath: string, filePath: string): Promise<void> {
  await runGit(['add', filePath], rootPath)
}

export async function unstageFile(rootPath: string, filePath: string): Promise<void> {
  await runGit(['restore', '--staged', filePath], rootPath)
}
