import type { ImageType, InfographicStyle, PhotoStyle, PostContext, BrandContext, LayoutTemplate, CompositionStyle } from './types';

// ─── Industry visual vocabulary ───────────────────────────────────────────────

const INDUSTRY_VISUALS: Record<string, { scenes: string; people: string; props: string; avoid: string }> = {
  insurance: {
    scenes: 'modern professional office, city skyline through floor-to-ceiling windows, financial district',
    people: 'confident professional in business attire, diverse age range, warm approachable expression, arms crossed or handshake',
    props: 'documents, laptop, city backdrop, growth charts, handshake, family scenes',
    avoid: 'generic clip art, fake smiles, cheesy stock poses',
  },
  roofing: {
    scenes: 'aerial view of residential neighborhood, professional crew on rooftop, clean finished shingles, suburban home exterior',
    people: 'professional crew in safety gear, homeowner smiling at finished work',
    props: 'shingles, tools, safety equipment, before/after home, ladder, professional truck',
    avoid: 'cartoon roofs, generic construction imagery',
  },
  fitness: {
    scenes: 'bright modern gym, outdoor training, dynamic motion blur, sunrise workout',
    people: 'athletic person mid-movement, confident posture, diverse body types, real effort not poses',
    props: 'weights, resistance bands, running shoes, healthy food, water bottle',
    avoid: 'overly perfect bodies, cheesy motivational poses',
  },
  legal: {
    scenes: 'clean professional law office, conference room, courthouse exterior, clean desk',
    people: 'authoritative professional in suit, serious but approachable expression',
    props: 'legal books, clean desk, scales of justice (subtle), gavel, documents',
    avoid: 'clichéd gavel close-ups, comic book lawyer imagery',
  },
  restaurant: {
    scenes: 'warm inviting dining room, close-up food photography, open kitchen, fresh ingredients',
    people: 'chef at work, happy diners, family meal, bartender crafting drinks',
    props: 'plated dishes, fresh ingredients, wine glasses, rustic wooden table, ambient candlelight',
    avoid: 'fast food aesthetics, generic cafeteria vibes',
  },
  'real-estate': {
    scenes: 'beautiful home exterior at golden hour, bright modern interior, aerial neighborhood view, for-sale sign with sold sticker',
    people: 'agent handing over keys, happy family in front of home, professional in smart attire',
    props: 'house keys, modern kitchen, open floor plan, suburb or urban home',
    avoid: 'rundown properties, generic apartment blocks',
  },
  healthcare: {
    scenes: 'clean modern clinic, doctor-patient consultation, bright medical office, laboratory',
    people: 'friendly doctor or nurse, diverse patients, warm reassuring interaction',
    props: 'stethoscope, medical tablet, clean white coat, welcoming reception',
    avoid: 'scary medical imagery, overly clinical cold environments',
  },
  tech: {
    scenes: 'modern startup office, glowing screens, developer at dual monitors, clean product UI on device',
    people: 'focused developer, diverse tech team collaboration, professional in casual smart attire',
    props: 'laptop, code on screen, product mockup, phone, minimalist desk setup',
    avoid: 'cheesy hacker imagery, dated tech aesthetics',
  },
  default: {
    scenes: 'professional modern office or relevant business environment, clean and well-lit',
    people: 'confident professional, warm and approachable expression, business casual',
    props: 'relevant business tools, laptop, clean workspace',
    avoid: 'generic stock photo clichés, fake handshakes, suits laughing at salad',
  },
};

function getIndustryVisuals(industry: string) {
  const key = Object.keys(INDUSTRY_VISUALS).find((k) => industry.toLowerCase().includes(k)) ?? 'default';
  return INDUSTRY_VISUALS[key];
}

// ─── Color description converter ─────────────────────────────────────────────
// Converts hex colors to natural language Gemini understands better

function describeColor(hex: string): string {
  const colorMap: Record<string, string> = {
    '#1a1a2e': 'deep navy blue',
    '#4ade80': 'bright lime green',
    '#f97316': 'vibrant orange',
    '#3b82f6': 'bright royal blue',
    '#ef4444': 'bold red',
    '#8b5cf6': 'rich purple',
    '#06b6d4': 'bright cyan teal',
    '#ffffff': 'crisp white',
    '#000000': 'pure black',
    '#1e3a5f': 'dark navy',
    '#d97706': 'amber gold',
    '#059669': 'emerald green',
  };
  const lower = hex.toLowerCase();
  return colorMap[lower] ?? hex;
}

function parseColors(colorStr: string): { primaryDesc: string; secondaryDesc: string; primary: string; secondary: string } {
  const primaryMatch = colorStr.match(/primary[:\s]+([#\w]+)/i);
  const secondaryMatch = colorStr.match(/secondary[:\s]+([#\w]+)/i);
  const primary = primaryMatch?.[1] ?? '#1a1a2e';
  const secondary = secondaryMatch?.[1] ?? '#4ade80';
  return {
    primary,
    secondary,
    primaryDesc: describeColor(primary),
    secondaryDesc: describeColor(secondary),
  };
}

// ─── CTA button text extractor ────────────────────────────────────────────────

function extractCTA(cta: string): string {
  if (!cta || cta.length < 3) return 'Learn More';
  // Extract the action phrase from the CTA
  const clean = cta.replace(/learn more at .*/i, '').replace(/visit .*/i, '').trim();
  if (clean.length > 3 && clean.length < 30) return clean;
  return 'Learn More';
}

// ─── Master router ────────────────────────────────────────────────────────────

export function generateImagePrompt(
  imageType: ImageType,
  layout: LayoutTemplate,
  composition: CompositionStyle,
  post: PostContext,
  brand: BrandContext,
  subStyle?: InfographicStyle | PhotoStyle
): string {
  const colors = parseColors(brand.colors);
  const industry = getIndustryVisuals(brand.industry);
  const ctaText = extractCTA(post.cta);

  // For infographics and text graphics, use the specialized builders
  if (imageType === 'infographic') return buildInfographicPrompt(post, brand, colors, subStyle as InfographicStyle);
  if (imageType === 'text_graphic') return buildTextGraphicPrompt(post, brand, colors);
  if (imageType === 'illustration') return buildIllustrationPrompt(post, brand, colors);

  // For all photo-based types, route through the layout system
  return buildLayoutPrompt(layout, composition, post, brand, colors, industry, ctaText, subStyle as PhotoStyle);
}

// ─── Layout-based prompt builder ──────────────────────────────────────────────

function buildLayoutPrompt(
  layout: LayoutTemplate,
  composition: CompositionStyle,
  post: PostContext,
  brand: BrandContext,
  colors: ReturnType<typeof parseColors>,
  industry: ReturnType<typeof getIndustryVisuals>,
  ctaText: string,
  photoStyle?: PhotoStyle
): string {
  switch (layout) {
    case 'hero_bottom_bar':   return layoutHeroBottomBar(post, brand, colors, industry, ctaText, photoStyle);
    case 'photo_mosaic':      return layoutPhotoMosaic(post, brand, colors, industry, ctaText);
    case 'split_panel':       return layoutSplitPanel(post, brand, colors, industry, ctaText);
    case 'vision_board':      return layoutVisionBoard(post, brand, colors, industry, ctaText);
    case 'stat_callout':      return layoutStatCallout(post, brand, colors, industry);
    case 'quote_card':        return layoutQuoteCard(post, brand, colors);
    case 'single_hero':       return layoutSingleHero(post, brand, colors, industry, photoStyle);
    default:                  return layoutHeroBottomBar(post, brand, colors, industry, ctaText, photoStyle);
  }
}

// ─── Layout 1: Hero Bottom Bar ───────────────────────────────────────────────
// Like Image 7 & 8 — professional person full bleed, solid color bar bottom 28%

function layoutHeroBottomBar(
  post: PostContext,
  brand: BrandContext,
  colors: ReturnType<typeof parseColors>,
  industry: ReturnType<typeof getIndustryVisuals>,
  ctaText: string,
  photoStyle?: PhotoStyle
): string {
  const headline = post.hook.toUpperCase().slice(0, 60);
  const subtitle = post.subtext ?? post.caption.slice(0, 80);

  return `Create a professional square 1080x1080 social media graphic with this EXACT layout:

BACKGROUND PHOTO (full bleed, fills entire canvas):
High-quality professional photo of ${industry.scenes}. ${industry.people}.
${photoStyle === 'neon_tech' ? 'Futuristic dark atmosphere with glowing elements.' : 'Well-lit, crisp, editorial quality. NOT stock-photo generic.'}
Photo is slightly darkened in the bottom third to ensure text contrast.
${industry.avoid} — avoid all of these.

TOP-LEFT CORNER: Small badge area — write "${brand.businessName}" in bold text on a small white rectangle with slight shadow. Font size: 18pt. Placed 24px from top-left edges.

BOTTOM BAR (critical — this must be exact):
Solid ${colors.primaryDesc} rectangle covering exactly the bottom 28% of the image.
Inside this bar, centered:
- Line 1: "${headline}" — ultra-bold white sans-serif, all caps, 46pt
- Line 2: "${subtitle.slice(0, 70)}" — regular weight white, 20pt, below Line 1

RIGHT EDGE ACCENT: Two thin vertical bars (8px wide each, touching the right edge) — top bar ${colors.secondaryDesc}, bottom bar a lighter tint. Run full canvas height.

QUALITY RULES:
- Text must be crisp and 100% readable at thumbnail size
- Maximum 2 fonts: one ultra-bold for headline, one clean regular for body
- No gradients on the text bar — solid flat color only
- Professional, magazine-quality output
- Do NOT add watermarks, borders, or frames`;
}

// ─── Layout 2: Photo Mosaic ───────────────────────────────────────────────────
// Like Image 11 — grid of photos, white header, centered CTA

function layoutPhotoMosaic(
  post: PostContext,
  brand: BrandContext,
  colors: ReturnType<typeof parseColors>,
  industry: ReturnType<typeof getIndustryVisuals>,
  ctaText: string
): string {
  const headline = post.hook;

  return `Create a square 1080x1080 social media graphic with this EXACT mosaic layout:

TOP HEADER BAR (white background, full width, ~18% height):
- Left side: "${brand.businessName}" in bold ${colors.primaryDesc} text, 22pt
- Right side of header: The headline "${headline}" in bold dark text, 20pt
- Clean separator line below header

PHOTO GRID (fills remaining 82% of canvas):
Arrange 6 high-quality photos in a clean grid (2 columns × 3 rows or 3 columns × 2 rows with one larger center photo).
Each photo shows a different scene of: ${industry.scenes}.
Include: ${industry.people} — diverse, authentic, not posed.
Photos are crisp, well-lit, no gaps between grid cells except thin 3px white lines.

CENTER OVERLAY (floating over grid center):
Semi-transparent white rounded rectangle (80% opacity) placed at vertical center.
Inside: "${ctaText}" as a bold ${colors.primaryDesc} button with ${colors.secondaryDesc} background, 18pt white text.

QUALITY RULES:
- Photos must all be same style/lighting/quality — coherent visual set
- Grid must be geometrically perfect — equal cell sizes
- CTA button has rounded corners (12px radius), good padding
- Overall feel: warm, human, community-focused`;
}

// ─── Layout 3: Split Panel ────────────────────────────────────────────────────

function layoutSplitPanel(
  post: PostContext,
  brand: BrandContext,
  colors: ReturnType<typeof parseColors>,
  industry: ReturnType<typeof getIndustryVisuals>,
  ctaText: string
): string {
  // Extract up to 3 benefit bullets from caption
  const sentences = post.caption.split(/[.!]/).filter((s) => s.trim().length > 10).slice(0, 3);
  const bullets = sentences.map((s) => `• ${s.trim()}`).join('\n');

  return `Create a square 1080x1080 social media graphic with this EXACT split-panel layout:

LEFT PANEL (45% of width, full height):
Solid ${colors.primaryDesc} background.
Content from top to bottom:
1. "${brand.businessName}" — small white bold text, 16pt, top area
2. "${post.hook.toUpperCase()}" — ultra-bold white text, 38pt, centered in panel, line-break at natural phrase point
3. Bullet benefits (white text, 15pt, left-aligned):
${bullets}
4. "${ctaText}" — rounded button with ${colors.secondaryDesc} background, white bold text, 16pt, bottom of panel

RIGHT PANEL (55% of width, full height):
High-quality professional photo of ${industry.scenes}.
${industry.people}. Crisp, editorial quality.
Photo fills panel completely with no padding.
Slightly brighter/warmer than the left panel to create contrast.

DIVIDER: Clean straight vertical line between panels — no blurred edge, no gradient blend.

TOP ACCENT: Thin horizontal bar (6px) in ${colors.secondaryDesc} across full width at very top.

QUALITY RULES:
- Left panel text must be perfectly readable, good line spacing
- Bullets use actual bullet points, not dashes
- Button has clear padding and rounded corners
- Photo is high-resolution, not stretched`;
}

// ─── Layout 4: Vision Board ───────────────────────────────────────────────────
// Like Image 6 — cork board feel, pinned photos, center text card

function layoutVisionBoard(
  post: PostContext,
  brand: BrandContext,
  colors: ReturnType<typeof parseColors>,
  industry: ReturnType<typeof getIndustryVisuals>,
  ctaText: string
): string {
  return `Create a square 1080x1080 social media graphic in a vision-board / cork-board style:

BACKGROUND:
Realistic cork board texture (warm tan/brown textured surface) filling entire canvas.
Slight vignette darkening at corners.

PINNED PHOTOS (7-8 photos pinned at slightly varying angles -8 to +8 degrees):
Small photos (120-200px each) pinned with colorful round pins (red, green, blue, yellow).
Place around the edges and corners of the canvas, overlapping slightly.
Each photo shows a different relevant scene: ${industry.scenes}.
${industry.people}. Varied compositions — landscape, portrait, close-up.
Include 1-2 sticky notes (yellow, pink) with short phrases like motivational words relevant to "${post.hook}".
Include "${brand.businessName}" written in a small label in top-right area.

CENTER CARD (this is the hero — must be prominent):
Clean white card (500x380px) pinned with a red pin at top-center, casting a subtle drop shadow.
Inside the card, top to bottom:
1. "${post.hook.toUpperCase()}" — bold ${colors.primaryDesc} text, 32pt, centered
2. Short benefit list — 2-3 lines of dark gray text, 14pt, centered
3. "${ctaText}" — solid ${colors.primaryDesc} rounded button, white text, 15pt

QUALITY RULES:
- Cork texture must be realistic (not flat color)
- Photos must look like real printed photographs with slight white borders
- Center card must stand out clearly from background — white card on cork
- Overall: aspirational, motivational, "dream board" energy`;
}

// ─── Layout 5: Stat Callout ───────────────────────────────────────────────────

function layoutStatCallout(
  post: PostContext,
  brand: BrandContext,
  colors: ReturnType<typeof parseColors>,
  industry: ReturnType<typeof getIndustryVisuals>
): string {
  return `Create a square 1080x1080 social media graphic with this EXACT stat/benefit callout layout:

BACKGROUND:
${colors.primaryDesc} solid background (full canvas).
Subtle geometric pattern or very faint diagonal lines for texture (low opacity, ~10%).

TOP SECTION:
"${brand.businessName}" in small ${colors.secondaryDesc} text, 16pt, centered.
"${post.hook.toUpperCase()}" — bold white, 36pt, centered, max 2 lines.

MIDDLE SECTION — STAT BOXES (the hero):
3 horizontal boxes (each ~280x140px), arranged in a row or staggered grid.
Each box: white background, rounded corners (16px), subtle drop shadow.
Box contents:
- Box 1: Large bold ${colors.primaryDesc} stat or benefit keyword (28pt) + small gray description (13pt)
- Box 2: Same format, different benefit
- Box 3: Same format, different benefit
Extract 3 specific benefits or proof points from: "${post.caption}"

BOTTOM SECTION:
Small professional photo (circular, 80px diameter) of ${industry.people} on the right.
"${post.cta}" — ${colors.secondaryDesc} rounded button, white text, 16pt, centered or left-aligned.

ACCENT: Thin ${colors.secondaryDesc} horizontal line separating top from stat boxes.

QUALITY RULES:
- Stat boxes must have clear visual hierarchy: big number/word + small description
- High contrast throughout — white text on dark, dark text on white boxes
- Feels authoritative, credible, data-driven`;
}

// ─── Layout 6: Quote Card ─────────────────────────────────────────────────────

function layoutQuoteCard(
  post: PostContext,
  brand: BrandContext,
  colors: ReturnType<typeof parseColors>
): string {
  const quote = post.hook.length > 10 ? post.hook : post.caption.slice(0, 120);

  return `Create a square 1080x1080 social media graphic — elegant quote card style:

BACKGROUND:
${colors.primaryDesc} solid color OR a soft gradient from ${colors.primaryDesc} (top) to a slightly lighter shade (bottom).
Subtle texture overlay (grain texture at 8% opacity) for depth.
Optional: very faint large quotation mark (") watermark in background at 5% opacity.

CENTER CONTENT (all centered, generous whitespace):
1. Large open-quote symbol (\") in ${colors.secondaryDesc}, 72pt, top area
2. "${quote}" — white, clean sans-serif, 28-34pt, centered, 2-3 line breaks at natural points, 80% canvas width max
3. Thin ${colors.secondaryDesc} horizontal line (140px wide) below quote
4. "${brand.businessName}" — small white text, 14pt, below line
5. "${post.cta}" — small ${colors.secondaryDesc} text link or tiny button, 12pt, bottom

LEFT EDGE: Thin vertical ${colors.secondaryDesc} bar (6px wide) running full height.

QUALITY RULES:
- Generous whitespace around quote — text should NOT feel cramped
- Quote must be perfectly readable — white on dark high contrast
- Clean, typographic, minimalist — the quote IS the design
- Two fonts max: elegant or bold sans-serif for quote, light sans for attribution`;
}

// ─── Layout 7: Single Hero ────────────────────────────────────────────────────

function layoutSingleHero(
  post: PostContext,
  brand: BrandContext,
  colors: ReturnType<typeof parseColors>,
  industry: ReturnType<typeof getIndustryVisuals>,
  photoStyle?: PhotoStyle
): string {
  const styleGuide: Record<string, string> = {
    adventure_travel: 'Wide cinematic landscape, human subject small in frame showing epic scale, golden hour or blue hour light, sense of freedom and possibility.',
    neon_tech: 'Dark background, subject interacting with glowing tech interfaces, neon cyan/magenta rim lighting, futuristic energy.',
    minimalist_aesthetic: 'Single focal subject, 65% negative space, soft directional light, muted neutral palette, refined magazine quality.',
    urban_street: 'Dynamic urban setting, bold contrast between subject and textured urban backdrop, authentic street energy.',
    popular_lifestyle: 'Warm candid lifestyle scene, soft natural light, genuine human moment, NOT posed.',
    creative_flat_lay: 'Perfect overhead flat-lay arrangement of relevant objects on textured surface, even soft light.',
  };
  const guide = styleGuide[photoStyle ?? 'popular_lifestyle'] ?? styleGuide.popular_lifestyle;

  return `Create a square 1080x1080 social media graphic — single powerful hero image:

MAIN IMAGE (full canvas):
${guide}
Scene specifics: ${industry.scenes}.
${industry.people}.
Props: ${industry.props}.
${industry.avoid} — avoid these completely.

TEXT OVERLAY (subtle, not overwhelming the image):
Bottom 20% of image has a subtle dark gradient fade (from transparent to semi-transparent black, 60% opacity).
Inside this gradient zone, bottom-left aligned:
- "${post.hook}" — bold white text, 24pt, max 2 lines
- "${brand.businessName}" — small white text, 13pt, below headline

TOP-RIGHT: Small "${brand.businessName}" text badge (white, 13pt) with minimal styling.

QUALITY RULES:
- The photo IS the message — it should be stunning on its own
- Text is secondary — present but not dominating
- Photorealistic, high-resolution, commercial photography quality
- Authentic — NOT generic stock photo aesthetic`;
}

// ─── Infographic (unchanged from original) ────────────────────────────────────

const INFOGRAPHIC_STYLE_SPECS: Record<InfographicStyle, { description: string; guidance: string; colorTreatment: string; typography: string }> = {
  isometric_3d: {
    description: '3D isometric illustration with structured perspective',
    guidance: '3D isometric viewpoint (30-degree angle). Layered elevated platforms or stacked elements. Sharp geometric shapes with depth and shadow. Modern color palette with subtle gradients. Each step on its own 3D platform. Connecting lines showing flow.',
    colorTreatment: 'Brand colors as primary, neutral grays for depth',
    typography: 'Modern sans-serif, mid-weight, ALL CAPS for step titles',
  },
  flat_vector: {
    description: 'Clean flat vector illustration with simple shapes and icons',
    guidance: 'Flat vector style (no gradients, no 3D). Simple circular or rounded-rectangle containers. Clean icons inside each shape. Connecting arrows in horizontal or stepped flow. Generous spacing. High contrast for readability.',
    colorTreatment: 'Brand colors with clear differentiation between steps',
    typography: 'Sans-serif, bold for step titles, regular for descriptions',
  },
  doodle_sketched: {
    description: 'Hand-drawn doodle/sketched style with playful lines',
    guidance: 'Hand-drawn aesthetic, slightly imperfect lines. Casual sketched arrows, thought bubbles, hand-drawn icons. Pencil or marker texture. Playful organic flow. White or soft cream background. Warm approachable energy.',
    colorTreatment: 'Soft brand colors, mostly black-line illustrations with color accents',
    typography: 'Hand-lettered feel for headers OR clean sans-serif as contrast',
  },
  watercolor: {
    description: 'Hand-painted watercolor style with soft gradients',
    guidance: 'Watercolor texture and soft gradient washes. Organic flowing shapes (not geometric). Soft color blooms between elements. Hand-painted feel for icons. White space with watercolor splashes as accents. Calm premium artistic energy.',
    colorTreatment: 'Soft brand colors with watercolor texture, muted and gentle',
    typography: 'Elegant serif or hand-lettered headers, clean sans-serif body',
  },
  neon_cyberpunk: {
    description: 'Neon glow cyberpunk style with futuristic elements',
    guidance: 'Dark navy or black background. Bright neon colors (cyan, magenta, electric blue). Glowing edges and light bloom on shapes and text. Tech-style icons (circuit lines, brain, satellite). Code or binary as subtle background texture. Sharp geometric shapes with glow halos.',
    colorTreatment: 'Dark base + neon accents. Brand colors only if they fit neon palette.',
    typography: 'Modern futuristic sans-serif with glow effects, possibly monospace',
  },
  minimalist: {
    description: 'Clean minimalist style with extensive negative space',
    guidance: 'Significant negative space (60-70% white/empty). Single horizontal or vertical line connecting numbered points. Tiny simple line icons (not filled, not colored). Numbered steps in plain typography. One accent color maximum used sparingly. Refined premium magazine-editorial feel.',
    colorTreatment: 'Black/white/neutral with ONE brand accent used minimally',
    typography: 'Clean modern sans-serif, light weight body, medium headers',
  },
};

function buildInfographicPrompt(post: PostContext, brand: BrandContext, colors: ReturnType<typeof parseColors>, style?: InfographicStyle): string {
  const spec = INFOGRAPHIC_STYLE_SPECS[style ?? 'flat_vector'] ?? INFOGRAPHIC_STYLE_SPECS.flat_vector;
  return `Create a social media infographic graphic (1080x1080).

DESIGN STYLE: ${spec.description}
VISUAL GUIDANCE: ${spec.guidance}
COLOR TREATMENT: ${spec.colorTreatment} — Primary color: ${colors.primaryDesc}, Accent: ${colors.secondaryDesc}
TYPOGRAPHY: ${spec.typography}

BRAND: ${brand.businessName}
POST CONTENT: "${post.caption}"
HOOK: "${post.hook}"
INDUSTRY: ${brand.industry}

LAYOUT RULES:
- Title at top: "${post.hook}" in large bold text
- 3-5 specific points or steps extracted from the post content below the title
- Each point has a small icon + short label + 1-line description
- ALL TEXT must be legible, correctly spelled — specify every word
- Specify EXACT text for every label, step, and title
- Visual hierarchy: title > steps > details
- Be exhaustively specific about colors, icons, layout, and every text element
- Do NOT leave text areas vague — name every word that appears`;
}

// ─── Text Graphic ─────────────────────────────────────────────────────────────

function buildTextGraphicPrompt(post: PostContext, brand: BrandContext, colors: ReturnType<typeof parseColors>): string {
  return `Create a square 1080x1080 branded text graphic — bold typography as the hero:

BACKGROUND: Solid ${colors.primaryDesc} OR a subtle diagonal gradient from ${colors.primaryDesc} to slightly lighter shade.
Faint geometric shapes (circles, lines) in background at 8% opacity for depth.

CENTER CONTENT (all centered):
1. Small "${brand.businessName}" label at top — ${colors.secondaryDesc} text, 14pt, with thin ${colors.secondaryDesc} underline
2. "${post.hook.toUpperCase()}" — ultra-bold white, 42-52pt, centered, max 3 lines, use natural line breaks
3. Thin ${colors.secondaryDesc} horizontal divider line (120px)
4. "${post.subtext ?? post.caption.slice(0, 80)}" — white, regular weight, 18pt, centered
5. "${post.cta}" — ${colors.secondaryDesc} rounded pill button, white bold text, 15pt

QUALITY RULES:
- Text IS the design — nothing competes with it
- Maximum 2 fonts. One ultra-bold for headline, one clean for body.
- All text perfectly readable at thumbnail size
- Specify exact wording — every word that appears in the image`;
}

// ─── Illustration ─────────────────────────────────────────────────────────────

function buildIllustrationPrompt(post: PostContext, brand: BrandContext, colors: ReturnType<typeof parseColors>): string {
  return `Create a square 1080x1080 flat illustration for a social media post:

STYLE: Modern flat illustration with subtle gradients (not photorealistic, not clipart)
BACKGROUND: ${colors.primaryDesc} solid or very subtle gradient
ILLUSTRATION CONCEPT: A visual metaphor for "${post.hook}" in the context of ${brand.industry}
BRAND COLORS: Primary ${colors.primaryDesc}, Accent ${colors.secondaryDesc}

ILLUSTRATION GUIDELINES:
- Clean vector-style illustration, strong shapes, clear focal point
- 2-3 main illustrated elements, not cluttered
- Brand colors used throughout as the primary palette
- Slight depth via layering and subtle shadows (no harsh 3D)
- Professional, modern, on-brand — NOT generic clipart

BOTTOM LABEL AREA:
Small white rounded rectangle at bottom with "${brand.businessName}" in ${colors.primaryDesc} text.

QUALITY RULES:
- Avoid generic looking clip art
- Illustration should feel custom, not template-like
- No text in main illustration except business name in label`;
}
