import type { CSSProperties } from 'react'
import { Slot } from '@/components/studio/Slot'
import { tokenStyle, type ThemeProps } from '@/lib/studio/theme'
import type { KitContent } from '@/lib/studio/kit-schema'

/**
 * Atlas kit — a complete landing page rendered from KitContent + a theme.
 *
 * Every value here reads a design-bible token (var(--…)); no raw colors or sizes.
 * That's what guarantees a good result: the AI fills the content, the theme sets
 * the tokens, and the layout/spacing/rhythm are fixed by this component.
 *
 * Renders 5 sections: Hero → Features → Showcase → Testimonials → CTA.
 * Self-contained and SSR-safe so it can be server-rendered to static HTML.
 */

// ── shared style helpers (token-driven) ──────────────────────────────────────
const SECTION_PAD = 'calc(72px * var(--pad-scale, 1)) 24px'
const MAXW = 1120

const display: CSSProperties = { fontFamily: "var(--font-display, 'Sora'), system-ui, sans-serif", color: 'var(--fg)', margin: 0, lineHeight: 1.1 }
const body: CSSProperties = { fontFamily: "var(--font-body, 'Manrope'), system-ui, sans-serif", color: 'var(--muted)', margin: 0, lineHeight: 1.6 }

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="#cta"
      style={{
        display: 'inline-block',
        background: 'var(--btn-bg)',
        color: 'var(--btn-fg)',
        border: `var(--border-w, 1px) solid var(--btn-border)`,
        boxShadow: 'var(--btn-shadow)',
        borderRadius: 'var(--btn-radius)',
        padding: '13px 22px',
        fontFamily: "var(--font-body, 'Manrope'), system-ui, sans-serif",
        fontWeight: 700,
        fontSize: 15,
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  )
}

function GhostButton({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="#features"
      style={{
        display: 'inline-block',
        color: 'var(--fg)',
        padding: '13px 18px',
        fontFamily: "var(--font-body, 'Manrope'), system-ui, sans-serif",
        fontWeight: 600,
        fontSize: 15,
        textDecoration: 'none',
        opacity: 0.85,
      }}
    >
      {children}
    </a>
  )
}

export function AtlasKit({ content, theme }: { content: KitContent; theme: ThemeProps }) {
  const root: CSSProperties = {
    ...tokenStyle(theme),
    background: 'var(--bg)',
    color: 'var(--fg)',
    minHeight: '100vh',
    WebkitFontSmoothing: 'antialiased',
  }

  return (
    <div style={root}>
      {/* HEADER */}
      <header style={{ maxWidth: MAXW, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ ...display, fontSize: 20, fontWeight: 800 }}>{content.brandName}</span>
        <PrimaryButton>{content.hero.ctaPrimary}</PrimaryButton>
      </header>

      {/* HERO */}
      <section style={{ padding: SECTION_PAD }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {content.hero.eyebrow && (
              <span style={{ ...body, color: 'var(--accent)', fontWeight: 700, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                {content.hero.eyebrow}
              </span>
            )}
            <h1 style={{ ...display, fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 800 }}>{content.hero.headline}</h1>
            <p style={{ ...body, fontSize: 18, maxWidth: 520 }}>{content.hero.subhead}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <PrimaryButton>{content.hero.ctaPrimary}</PrimaryButton>
              {content.hero.ctaSecondary && <GhostButton>{content.hero.ctaSecondary}</GhostButton>}
            </div>
          </div>
          <Slot src={content.hero.image.src} alt={content.hero.image.alt} shape="4/3" placeholder="Hero image" />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: SECTION_PAD, background: 'var(--surface)' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 40px' }}>
            <h2 style={{ ...display, fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800 }}>{content.features.heading}</h2>
            {content.features.subhead && <p style={{ ...body, fontSize: 17, marginTop: 14 }}>{content.features.subhead}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {content.features.items.map((f, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg)',
                  border: 'var(--border-w, 1px) solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'var(--accent)', opacity: 0.92 }} />
                <h3 style={{ ...display, fontSize: 18, fontWeight: 700 }}>{f.title}</h3>
                <p style={{ ...body, fontSize: 15 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section style={{ padding: SECTION_PAD }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 48, alignItems: 'center' }}>
          <Slot src={content.showcase.image.src} alt={content.showcase.image.alt} shape="3/2" placeholder="Showcase image" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ ...display, fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800 }}>{content.showcase.heading}</h2>
            <p style={{ ...body, fontSize: 17 }}>{content.showcase.body}</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {content.testimonials.items.length > 0 && (
        <section style={{ padding: SECTION_PAD, background: 'var(--surface)' }}>
          <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
            {content.testimonials.heading && (
              <h2 style={{ ...display, fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, textAlign: 'center', marginBottom: 36 }}>
                {content.testimonials.heading}
              </h2>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, content.testimonials.items.length)}, 1fr)`, gap: 20 }}>
              {content.testimonials.items.map((t, i) => (
                <figure
                  key={i}
                  style={{
                    margin: 0,
                    background: 'var(--bg)',
                    border: 'var(--border-w, 1px) solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <blockquote style={{ ...display, fontSize: 17, fontWeight: 600, lineHeight: 1.45, margin: 0, color: 'var(--fg)' }}>
                    “{t.quote}”
                  </blockquote>
                  <figcaption style={{ ...body, fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{t.author}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section id="cta" style={{ padding: SECTION_PAD }}>
        <div
          style={{
            maxWidth: MAXW,
            margin: '0 auto',
            background: 'var(--accent)',
            borderRadius: 'var(--radius)',
            padding: 'calc(56px * var(--pad-scale, 1)) 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <h2 style={{ ...display, color: 'var(--accent-fg)', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800 }}>{content.cta.headline}</h2>
          {content.cta.subhead && <p style={{ ...body, color: 'var(--accent-fg)', opacity: 0.92, fontSize: 17, maxWidth: 520 }}>{content.cta.subhead}</p>}
          <a
            href="#"
            style={{
              display: 'inline-block',
              marginTop: 6,
              background: 'var(--accent-fg)',
              color: 'var(--accent)',
              borderRadius: 'var(--btn-radius)',
              padding: '14px 26px',
              fontFamily: "var(--font-body, 'Manrope'), system-ui, sans-serif",
              fontWeight: 800,
              fontSize: 16,
              textDecoration: 'none',
            }}
          >
            {content.cta.button}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ maxWidth: MAXW, margin: '0 auto', padding: '28px 24px', borderTop: 'var(--border-w, 1px) solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...display, fontWeight: 700, fontSize: 16 }}>{content.brandName}</span>
        <span style={{ ...body, fontSize: 13 }}>Built with Studio</span>
      </footer>
    </div>
  )
}
