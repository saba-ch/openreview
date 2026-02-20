/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        base: 'var(--color-base)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        overlay: 'var(--color-overlay)',
        line: 'var(--color-border)',
        'line-subtle': 'var(--color-border-subtle)',
        ink: 'var(--color-text-primary)',
        'ink-dim': 'var(--color-text-secondary)',
        'ink-ghost': 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        'accent-hi': 'var(--color-accent-hover)',
        'diff-add': 'var(--color-added-bg)',
        'diff-add-fg': 'var(--color-added-text)',
        'diff-remove': 'var(--color-removed-bg)',
        'diff-remove-fg': 'var(--color-removed-text)',
        'diff-hunk': 'var(--color-hunk-bg)',
        'diff-hunk-fg': 'var(--color-hunk-text)',
        'diff-add-border': 'var(--color-added-border)',
        'diff-remove-border': 'var(--color-removed-border)',
      },
    },
  },
  plugins: [],
}
