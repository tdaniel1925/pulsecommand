import { Slot } from '@/components/studio/Slot'
import type { ThemeProps } from '@/lib/studio/theme'
import type { KitContent } from '@/lib/studio/kit-schema'

/**
 * Hero block with two byte-consistent variants (both use the same design tokens,
 * so neither can look off-brand):
 *  - "split" (default): text + image side by side — the original Atlas hero.
 *  - "centered": eyebrow/headline/subhead/CTAs centered, image full-width below.
 */

const eyebrow = (content: KitContent) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, background: 'var(--surface-2,#F6EEE3)', border: 'var(--border-w,1px) solid var(--border,#EADFD2)', fontFamily: "var(--font-body,'Manrope')", fontWeight: 600, fontSize: 13, color: 'var(--muted,#8A7B6B)', marginBottom: 22 }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent,#E0603A)' }}></span> {content.hero.eyebrow ?? 'New — AI page builder is live'}
  </span>
)

const ctas = (content: KitContent, center: boolean) => (
  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: center ? 'center' : 'flex-start' }}>
    <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', background: 'var(--btn-bg,#E0603A)', color: 'var(--btn-fg,#fff)', border: '2px solid var(--btn-border,transparent)', borderRadius: 'var(--btn-radius,12px)', boxShadow: 'var(--btn-shadow,none)', fontFamily: "var(--font-body,'Manrope')", fontWeight: 700, fontSize: 17, textDecoration: 'none', transition: 'transform .15s ease' }}>{content.hero.ctaPrimary} →</a>
    <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '16px 26px', background: 'transparent', color: 'var(--fg)', border: '2px solid var(--border,#EADFD2)', borderRadius: 'var(--btn-radius,12px)', fontFamily: "var(--font-body,'Manrope')", fontWeight: 600, fontSize: 17, textDecoration: 'none' }}>▶ {content.hero.ctaSecondary ?? 'Watch demo'}</a>
  </div>
)

const sectionHeader = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 34 }}>
    <span style={{ fontFamily: "var(--font-body,'Manrope')", fontSize: 12, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent,#E0603A)' }}>01 / Hero</span>
    <span style={{ height: 1, flex: 1, background: 'var(--border,#EADFD2)' }}></span>
  </div>
)

export function HeroBlock({ content, variant }: { content: KitContent; theme: ThemeProps; variant?: string }) {
  if (variant === 'centered') {
    return (
      <section style={{ padding: 'calc(var(--pad-scale,1) * 88px) 0 calc(var(--pad-scale,1) * 64px)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
          {sectionHeader}
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
            {eyebrow(content)}
            <h1 style={{ fontFamily: "var(--font-display,'Sora'),sans-serif", fontWeight: 800, fontSize: 'clamp(40px,5.4vw,64px)', lineHeight: 1.02, letterSpacing: '-.03em', margin: '0 0 22px' }}>{content.hero.headline}</h1>
            <p style={{ fontFamily: "var(--font-body,'Manrope')", fontSize: 19, lineHeight: 1.6, color: 'var(--muted,#8A7B6B)', margin: '0 auto 32px', maxWidth: '34em' }}>{content.hero.subhead}</p>
            {ctas(content, true)}
          </div>
          <div style={{ marginTop: 48, borderRadius: 'var(--img-radius,16px)', overflow: 'hidden', boxShadow: 'var(--img-shadow,0 14px 38px rgba(90,55,30,.10))', border: 'var(--img-border,none)', filter: 'var(--img-filter,none)' }}>
            <Slot variant="rect" shape="21/9" src={content.hero.image.src} alt={content.hero.image.alt} placeholder="Drop a photo or video" style={{ width: '100%', display: 'block' }} />
          </div>
        </div>
      </section>
    )
  }

  // Default: split layout (original Atlas hero).
  return (
    <section style={{ padding: 'calc(var(--pad-scale,1) * 88px) 0 calc(var(--pad-scale,1) * 64px)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
        {sectionHeader}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 48, alignItems: 'stretch' }}>
          <div style={{ alignSelf: 'center' }}>
            {eyebrow(content)}
            <h1 style={{ fontFamily: "var(--font-display,'Sora'),sans-serif", fontWeight: 800, fontSize: 'clamp(40px,5.4vw,64px)', lineHeight: 1.02, letterSpacing: '-.03em', margin: '0 0 22px' }}>{content.hero.headline}</h1>
            <p style={{ fontFamily: "var(--font-body,'Manrope')", fontSize: 19, lineHeight: 1.6, color: 'var(--muted,#8A7B6B)', margin: '0 0 32px', maxWidth: '30em' }}>{content.hero.subhead}</p>
            {ctas(content, false)}
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12, fontFamily: "var(--font-body,'Manrope')", fontSize: 14, color: 'var(--muted,#8A7B6B)' }}>
              <div style={{ display: 'flex' }}>
                <Slot variant="circle" src={null} placeholder="" style={{ width: 34, height: 34, display: 'block', border: '2px solid var(--surface,#fff)', borderRadius: '50%' }} />
                <Slot variant="circle" src={null} placeholder="" style={{ width: 34, height: 34, display: 'block', border: '2px solid var(--surface,#fff)', borderRadius: '50%', marginLeft: -12 }} />
                <Slot variant="circle" src={null} placeholder="" style={{ width: 34, height: 34, display: 'block', border: '2px solid var(--surface,#fff)', borderRadius: '50%', marginLeft: -12 }} />
              </div>
              Loved by 12,000+ builders
            </div>
          </div>
          <div style={{ borderRadius: 'var(--img-radius,16px)', overflow: 'hidden', boxShadow: 'var(--img-shadow,0 14px 38px rgba(90,55,30,.10))', border: 'var(--img-border,none)', filter: 'var(--img-filter,none)', display: 'flex', minHeight: 480 }}>
            <Slot variant="rect" src={content.hero.image.src} alt={content.hero.image.alt} placeholder="Drop a photo or video" style={{ width: '100%', height: '100%', minHeight: 480, display: 'block' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
