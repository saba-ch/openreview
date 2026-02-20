import React, { useState, useMemo, useCallback } from 'react'
import { useRepoStore } from '../store/repo'
import { DiffFile } from '../../shared/types'

// ─── Tree types ───────────────────────────────────────────────────────────────

interface TreeDir {
  kind: 'dir'
  name: string
  fullPath: string
  children: TreeNode[]
}

interface TreeFile {
  kind: 'file'
  name: string
  file: DiffFile
}

type TreeNode = TreeDir | TreeFile

// ─── Tree builders ────────────────────────────────────────────────────────────

function buildTree(files: DiffFile[]): TreeNode[] {
  const root: TreeNode[] = []
  for (const file of files) {
    const parts = file.filePath.split('/')
    let current = root
    let currentPath = ''
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]
      let dir = current.find((n): n is TreeDir => n.kind === 'dir' && n.name === parts[i])
      if (!dir) {
        dir = { kind: 'dir', name: parts[i], fullPath: currentPath, children: [] }
        current.push(dir)
      }
      current = dir.children
    }
    current.push({ kind: 'file', name: parts[parts.length - 1], file })
  }
  return root
}

function pruneTree(nodes: TreeNode[], filter: string): TreeNode[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'file') {
      return node.file.filePath.toLowerCase().includes(filter) ? [node] : []
    }
    const prunedChildren = pruneTree(node.children, filter)
    return prunedChildren.length > 0 ? [{ ...node, children: prunedChildren }] : []
  })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-transform duration-100"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
      <path d="M3 2l4 3-4 3" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M1 3.5h3.5l1 1.5H11a.5.5 0 0 1 .5.5V9a.5.5 0 0 1-.5.5H1A.5.5 0 0 1 .5 9V4a.5.5 0 0 1 .5-.5Z" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M2 1h5l2.5 2.5V10a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V1.5A.5.5 0 0 1 2 1Z" />
      <path d="M7 1v2.5H9.5" />
    </svg>
  )
}

// ─── Tree node renderers ──────────────────────────────────────────────────────

interface TreeNodesProps {
  nodes: TreeNode[]
  depth: number
  closedDirs: Set<string>
  filterActive: boolean
  onToggleDir: (path: string) => void
  selectedFile: DiffFile | null
  onSelectFile: (file: DiffFile) => void
  onToggleStage: (file: DiffFile, e: React.MouseEvent) => void
}

function TreeNodes(props: TreeNodesProps) {
  return (
    <>
      {props.nodes.map((node) =>
        node.kind === 'dir' ? (
          <DirRow key={node.fullPath} node={node} {...props} />
        ) : (
          <FileRow
            key={`${node.file.filePath}:${node.file.staged}`}
            node={node}
            depth={props.depth}
            selectedFile={props.selectedFile}
            onSelectFile={props.onSelectFile}
            onToggleStage={props.onToggleStage}
          />
        ),
      )}
    </>
  )
}

function DirRow({
  node,
  depth,
  closedDirs,
  filterActive,
  onToggleDir,
  selectedFile,
  onSelectFile,
  onToggleStage,
}: TreeNodesProps & { node: TreeDir }) {
  const isOpen = filterActive || !closedDirs.has(node.fullPath)
  return (
    <>
      <div
        className="flex cursor-pointer items-center gap-1 text-ink-ghost hover:bg-overlay"
        style={{ height: 24, paddingLeft: 8 + depth * 14 }}
        onClick={() => onToggleDir(node.fullPath)}
      >
        <ChevronIcon open={isOpen} />
        <FolderIcon />
        <span className="ml-0.5 truncate font-mono text-[11px]">{node.name}</span>
      </div>
      {isOpen && (
        <TreeNodes
          nodes={node.children}
          depth={depth + 1}
          closedDirs={closedDirs}
          filterActive={filterActive}
          onToggleDir={onToggleDir}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          onToggleStage={onToggleStage}
        />
      )}
    </>
  )
}

function FileRow({
  node,
  depth,
  selectedFile,
  onSelectFile,
  onToggleStage,
}: {
  node: TreeFile
  depth: number
  selectedFile: DiffFile | null
  onSelectFile: (file: DiffFile) => void
  onToggleStage: (file: DiffFile, e: React.MouseEvent) => void
}) {
  const { file } = node
  const isSelected =
    selectedFile?.filePath === file.filePath && selectedFile?.staged === file.staged
  return (
    <div
      className={`flex cursor-pointer items-center gap-1.5 border-l-2 ${
        isSelected ? 'border-accent bg-overlay text-ink' : 'border-transparent text-ink-dim hover:bg-overlay'
      }`}
      style={{ height: 26, paddingLeft: 8 + depth * 14 }}
      onClick={() => onSelectFile(file)}
    >
      <input
        type="checkbox"
        checked={file.staged}
        onChange={() => {}}
        onClick={(e) => onToggleStage(file, e)}
        className="h-3 w-3 shrink-0 cursor-pointer accent-accent"
      />
      <FileIcon />
      <span className={`truncate font-mono text-[11px] ${isSelected ? 'text-ink' : 'text-ink-dim'}`}>
        {node.name}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-1 pr-2 font-mono text-[9px]">
        {file.additions > 0 && <span className="text-diff-add-fg">+{file.additions}</span>}
        {file.deletions > 0 && <span className="text-diff-remove-fg">-{file.deletions}</span>}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SidebarProps {
  onRefreshDiff: () => Promise<void>
}

export default function Sidebar({ onRefreshDiff }: SidebarProps): React.ReactElement {
  const rootPath = useRepoStore((state) => state.rootPath)
  const files = useRepoStore((state) => state.files)
  const selectedFile = useRepoStore((state) => state.selectedFile)
  const setSelectedFile = useRepoStore((state) => state.setSelectedFile)

  const [filter, setFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'unstaged' | 'staged'>('unstaged')
  const [closedDirs, setClosedDirs] = useState<Set<string>>(new Set())

  const lowerFilter = filter.toLowerCase()

  const stagedFiles = useMemo(() => files.filter((f) => f.staged), [files])
  const unstagedFiles = useMemo(() => files.filter((f) => !f.staged), [files])
  const activeFiles = activeTab === 'staged' ? stagedFiles : unstagedFiles

  const tree = useMemo(() => buildTree(activeFiles), [activeFiles])
  const displayTree = useMemo(
    () => (lowerFilter ? pruneTree(tree, lowerFilter) : tree),
    [tree, lowerFilter],
  )

  const handleToggleDir = useCallback((path: string) => {
    setClosedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const handleToggleStage = useCallback(
    async (file: DiffFile, e: React.MouseEvent) => {
      e.stopPropagation()
      if (!rootPath) return
      if (file.staged) {
        await window.electron.unstageFile(rootPath, file.filePath)
      } else {
        await window.electron.stageFile(rootPath, file.filePath)
      }
      await onRefreshDiff()
    },
    [rootPath, onRefreshDiff],
  )

  const handleStageAll = useCallback(async () => {
    if (!rootPath) return
    for (const f of unstagedFiles) await window.electron.stageFile(rootPath, f.filePath)
    await onRefreshDiff()
  }, [rootPath, unstagedFiles, onRefreshDiff])

  const handleUnstageAll = useCallback(async () => {
    if (!rootPath) return
    for (const f of stagedFiles) await window.electron.unstageFile(rootPath, f.filePath)
    await onRefreshDiff()
  }, [rootPath, stagedFiles, onRefreshDiff])

  return (
    <div className="flex w-56 shrink-0 flex-col border-r border-line bg-elevated">
      {/* Tab bar */}
      <div className="flex shrink-0 items-stretch border-b border-line" style={{ minHeight: 34 }}>
        <button
          onClick={() => setActiveTab('unstaged')}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 font-mono text-[11px] transition-colors ${
            activeTab === 'unstaged'
              ? 'border-b-2 border-accent text-ink'
              : 'text-ink-ghost hover:text-ink-dim'
          }`}
        >
          Unstaged
          <span className="font-mono text-[10px] tabular-nums text-ink-ghost">
            {unstagedFiles.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('staged')}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 font-mono text-[11px] transition-colors ${
            activeTab === 'staged'
              ? 'border-b-2 border-accent text-ink'
              : 'text-ink-ghost hover:text-ink-dim'
          }`}
        >
          Staged
          <span className="font-mono text-[10px] tabular-nums text-ink-ghost">
            {stagedFiles.length}
          </span>
        </button>
        <div className="flex items-center pr-1.5">
          {activeTab === 'unstaged' ? (
            <button
              onClick={handleStageAll}
              className="rounded px-1.5 py-0.5 font-mono text-[9px] text-ink-ghost transition-colors hover:bg-overlay hover:text-ink-dim"
              title="Stage All"
            >
              +all
            </button>
          ) : (
            <button
              onClick={handleUnstageAll}
              className="rounded px-1.5 py-0.5 font-mono text-[9px] text-ink-ghost transition-colors hover:bg-overlay hover:text-ink-dim"
              title="Unstage All"
            >
              -all
            </button>
          )}
        </div>
      </div>

      {/* Filter input */}
      <div className="border-b border-line px-2 py-1.5">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-ghost"
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="5" cy="5" r="3.5" />
            <path d="M8 8l2.5 2.5" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files…"
            className="w-full rounded-md border border-line-subtle bg-surface py-1 pl-6 pr-2 text-xs text-ink placeholder-ink-ghost outline-none transition-colors focus:border-accent focus:ring-0"
          />
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {displayTree.length === 0 ? (
          <p className="px-3 py-4 font-mono text-[11px] text-ink-ghost">no files</p>
        ) : (
          <TreeNodes
            nodes={displayTree}
            depth={0}
            closedDirs={closedDirs}
            filterActive={lowerFilter.length > 0}
            onToggleDir={handleToggleDir}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onToggleStage={handleToggleStage}
          />
        )}
      </div>
    </div>
  )
}
