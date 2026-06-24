import type { CSSProperties } from 'react'

/**
 * Studio image Slot — the "you can't place a bad image" primitive.
 *
 * A slot declares its own shape (aspect ratio) and focal point. Whatever image
 * is dropped in — tall, wide, huge, tiny — is fitted with object-fit: cover and
 * positioned by focal point, so it always fills the frame cleanly and never
 * stretches or letterboxes. Styling (radius/shadow/border/filter) comes from the
 * theme tokens, so every image matches the page's design bible automatically.
 *
 * SSR-safe and pure CSS — published pages stay fast and SEO-friendly. The
 * interactive drag/resize/crop affordances from the editor live elsewhere.
 */

export type SlotShape = '16/9' | '4/3' | '1/1' | '3/4' | '4/5' | '21/9' | '3/2'
export type FocalPoint = 'center' | 'top' | 'bottom' | 'left' | 'right'

const FOCAL_TO_POSITION: Record<FocalPoint, string> = {
  center: 'center',
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
}

export interface SlotProps {
  /** Image URL. When absent, a themed placeholder is shown. */
  src?: string | null
  alt?: string
  /** Frame shape — the slot enforces this regardless of the image's real ratio. */
  shape?: SlotShape
  focal?: FocalPoint
  /** "rect" (default) uses the image token radius; "circle" forces a round frame. */
  variant?: 'rect' | 'circle'
  className?: string
  style?: CSSProperties
  /** Placeholder label shown when there's no src. */
  placeholder?: string
}

export function Slot({
  src,
  alt = '',
  shape = '16/9',
  focal = 'center',
  variant = 'rect',
  className,
  style,
  placeholder = '',
}: SlotProps) {
  const isCircle = variant === 'circle'

  const frameStyle: CSSProperties = {
    aspectRatio: isCircle ? '1 / 1' : shape.replace('/', ' / '),
    overflow: 'hidden',
    borderRadius: isCircle ? '999px' : 'var(--img-radius, 16px)',
    boxShadow: isCircle ? 'none' : 'var(--img-shadow, none)',
    border: 'var(--img-border, none)',
    background: 'var(--surface-2, #f0e9df)',
    display: 'block',
    width: '100%',
    ...style,
  }

  const imgStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: FOCAL_TO_POSITION[focal],
    filter: 'var(--img-filter, none)',
    display: 'block',
  }

  return (
    <div className={className} style={frameStyle}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} style={imgStyle} loading="lazy" />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted, #8A7B6B)',
            fontFamily: "var(--font-body, 'Manrope'), system-ui, sans-serif",
            fontSize: 13,
            letterSpacing: '.01em',
          }}
        >
          {placeholder}
        </div>
      )}
    </div>
  )
}
