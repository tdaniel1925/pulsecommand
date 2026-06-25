'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
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
  const rootRef = useRef<HTMLDivElement>(null)

  // Scroll-reveal. CRITICAL: blocks start at opacity:0 (.sx-reveal) and only
  // become visible once .sx-in is added. The inline <script> approach only fires
  // on a full server-rendered page load, so in the CLIENT editor preview (where
  // content is injected via React state) it never ran → the whole canvas stayed
  // invisible. This effect re-runs on every content/layout change, observes
  // against the actual scroll container, and ALWAYS fails safe to visible.
  useEffect(() => {
    const rootEl = rootRef.current
    if (!rootEl) return
    // Arm reveal only now that JS is running — until this class is present the
    // CSS keeps .sx-reveal fully visible, so no-JS / pre-hydration is never blank.
    rootEl.classList.add('sx-armed')
    const els = Array.from(rootEl.querySelectorAll<HTMLElement>('.sx-reveal'))
    if (els.length === 0) return

    // Find the nearest scrollable ancestor (the editor's <main> or the window).
    let scrollParent: Element | null = rootEl.parentElement
    while (scrollParent && scrollParent !== document.body) {
      const oy = getComputedStyle(scrollParent).overflowY
      if (oy === 'auto' || oy === 'scroll') break
      scrollParent = scrollParent.parentElement
    }

    const reveal = (el: Element) => el.classList.add('sx-in')
    if (!('IntersectionObserver' in window)) {
      els.forEach(reveal)
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target) } }),
      { root: scrollParent === document.body ? null : scrollParent, threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )
    els.forEach((el) => io.observe(el))

    // Safety net: if anything goes wrong, reveal everything after a beat so the
    // page can never stay blank.
    const failsafe = setTimeout(() => els.forEach(reveal), 1200)
    return () => { io.disconnect(); clearTimeout(failsafe) }
  }, [content, blocks.length, theme])

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
    <div ref={rootRef} className="sx-root" style={root}>
      <CanvasStyles />
      {blocks.map((type, i) => {
        const Block = BLOCKS[type].Component
        return <Block key={`${type}-${i}`} content={content} theme={theme} variant={v[type]} />
      })}
    </div>
  )
}

/**
 * Premium polish layer — injected once per page. Inline styles can't do :hover or
 * keyframes, so the motion/depth lives here as real CSS classes the blocks opt into
 * (.sx-lift, .sx-btn, .sx-reveal, .sx-grad). Scroll-reveal is progressive
 * enhancement: a tiny IntersectionObserver reveals sections; with no JS they're
 * simply visible. SSR-safe — no client hooks needed.
 */
function CanvasStyles() {
  const css = `
.sx-root *{box-sizing:border-box}
/* Buttons + cards: smooth lift on hover */
.sx-btn{transition:transform .18s cubic-bezier(.2,.7,.3,1),box-shadow .18s ease,filter .18s ease;will-change:transform}
.sx-btn:hover{transform:translateY(-2px);filter:brightness(1.03)}
.sx-lift{transition:transform .25s cubic-bezier(.2,.7,.3,1),box-shadow .25s ease}
.sx-lift:hover{transform:translateY(-4px);box-shadow:var(--hover-shadow,0 22px 60px rgba(0,0,0,.12))}
.sx-link{transition:opacity .15s ease,color .15s ease}
.sx-link:hover{opacity:1;color:var(--accent)}
/* Scroll reveal — only hidden once JS arms the root (.sx-armed); otherwise the
   content is fully visible, so the page can never render blank without JS. */
.sx-armed .sx-reveal{opacity:0;transform:translateY(18px);transition:opacity .6s cubic-bezier(.2,.7,.3,1),transform .6s cubic-bezier(.2,.7,.3,1)}
.sx-armed .sx-reveal.sx-in{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){.sx-armed .sx-reveal{opacity:1;transform:none;transition:none}.sx-btn,.sx-lift{transition:none}}
/* Subtle grain texture overlay for accent bands */
.sx-grain{position:relative;isolation:isolate}
.sx-grain::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")}
`.trim()
  // Reveal is handled by CanvasPage's useEffect (arms .sx-armed, observes against
  // the real scroll container, fails safe to visible) — works in both the client
  // editor preview and the hydrated published page.
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
