import type { CSSProperties } from 'react'
import { tokenStyle, type ThemeProps } from '@/lib/studio/theme'
import type { KitContent } from '@/lib/studio/kit-schema'
import { BLOCKS, normalizeLayout, type BlockType } from './blocks/registry'

/**
 * The living canvas. A page is an ordered list of blocks (its `layout`), rendered
 * inside one token-style root. The layout is normalized first, so whatever order
 * is passed in, the result is always a valid, coherent page — header first, footer
 * last, no duplicates, no unknown blocks. Each block also falls back to its own
 * on-brand copy when its content is absent. Together: it can't break.
 *
 * This single renderer powers both the editor preview and the published page, so
 * what you see is exactly what publishes.
 */
export function CanvasPage({
  content,
  theme,
  layout,
  variants,
}: {
  content: KitContent
  theme: ThemeProps
  layout: BlockType[] | unknown
  /** Optional per-block variant id, e.g. { hero: "centered" }. */
  variants?: Record<string, string> | null
}) {
  const blocks = normalizeLayout(layout)
  const v = variants ?? {}

  const root: CSSProperties = {
    ...tokenStyle(theme),
    width: '100%',
    background: 'var(--bg,#FBF6EF)',
    color: 'var(--fg,#2A2018)',
    fontFamily: "var(--font-body,'Manrope'),system-ui,sans-serif",
    minHeight: '100vh',
    WebkitFontSmoothing: 'antialiased',
  }

  return (
    <div style={root}>
      {blocks.map((type, i) => {
        const Block = BLOCKS[type].Component
        return <Block key={`${type}-${i}`} content={content} theme={theme} variant={v[type]} />
      })}
    </div>
  )
}
