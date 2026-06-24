import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@bundledcontent.com'

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendWelcomeEmail({
  to,
  firstName,
  businessName,
  pin,
}: {
  to: string
  firstName: string
  businessName: string
  pin: string
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Welcome to BundledContent, ${firstName}!`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden;">
    <div style="background: #2563eb; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">⚡ BundledContent</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #111827; margin-top: 0;">Welcome, ${firstName}!</h2>
      <p style="color: #6b7280;">Your account for <strong>${businessName}</strong> is ready. Your content machine starts now.</p>

      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="color: #0369a1; font-size: 13px; margin: 0 0 8px 0; font-weight: 600;">YOUR ONBOARDING PIN</p>
        <p style="color: #0c4a6e; font-size: 36px; font-weight: 800; letter-spacing: 8px; margin: 0;">${pin}</p>
        <p style="color: #0369a1; font-size: 12px; margin: 8px 0 0 0;">Use this when you call +1 (651) 728-7626 for your brand interview</p>
      </div>

      <h3 style="color: #111827;">What happens next:</h3>
      <ol style="color: #6b7280; line-height: 1.8;">
        <li>Call <strong>+1 (651) 728-7626</strong> and enter your PIN when prompted</li>
        <li>Complete your 15-minute brand interview with our AI</li>
        <li>We'll build your brand profile and start generating content</li>
        <li>Within 48 hours, your first content batch will be ready</li>
      </ol>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display: inline-block; background: #2563eb; color: white; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px;">
          Go to Dashboard →
        </a>
      </div>
    </div>
    <div style="padding: 20px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} BundledContent. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  })
}

export async function sendReportEmail({
  to,
  firstName,
  month,
  year,
  pdfUrl,
}: {
  to: string
  firstName: string
  month: string
  year: number
  pdfUrl?: string
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your ${month} ${year} Performance Report is Ready`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Inter, sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden;">
    <div style="background: #2563eb; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">⚡ BundledContent</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #111827; margin-top: 0;">Hi ${firstName}, your ${month} report is ready!</h2>
      <p style="color: #6b7280;">Your monthly performance report for ${month} ${year} has been generated.</p>
      ${pdfUrl ? `<div style="text-align: center; margin-top: 32px;">
        <a href="${pdfUrl}" style="display: inline-block; background: #2563eb; color: white; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
          Download Report PDF
        </a>
      </div>` : ''}
      <div style="text-align: center; margin-top: 16px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/report" style="color: #2563eb; font-size: 14px;">View in Dashboard →</a>
      </div>
    </div>
  </div>
</body>
</html>`,
  })
}

// ─── Shared email shell ───────────────────────────────────────────────────────

function emailShell(title: string, body: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f3f4f6;margin:0;padding:32px 16px;">
  <div style="max-width:580px;margin:0 auto;background:white;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#6366f1;padding:28px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">⚡ PulseCommand</h1>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">by bundledcontent.com</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#111827;margin-top:0;font-size:20px;">${title}</h2>
      ${body}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">© ${year} BundledContent. All rights reserved.<br>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color:#6366f1;text-decoration:none;">Go to Dashboard</a></p>
    </div>
  </div>
</body>
</html>`;
}

function ctaButton(label: string, url: string, color = '#6366f1'): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:${color};color:white;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;">${label} →</a>
  </div>`;
}

// ─── Post ready for approval ──────────────────────────────────────────────────

export async function sendPostReadyEmail({
  to,
  businessName,
  caption,
  imageUrl,
}: {
  to: string;
  businessName: string;
  caption: string;
  imageUrl?: string | null;
  postId: string;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social`;
  const preview = caption.slice(0, 120) + (caption.length > 120 ? '...' : '');

  const body = `
    <p style="color:#6b7280;">Your weekly AI-generated post for <strong>${businessName}</strong> is ready for your review.</p>
    ${imageUrl ? `<div style="margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <img src="${imageUrl}" alt="Post image" style="width:100%;display:block;max-height:280px;object-fit:cover;" />
    </div>` : ''}
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">${preview}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;">Approve it to publish, or reject and we'll generate a new one.</p>
    ${ctaButton('Review Your Post', dashboardUrl)}
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your new post is ready to review — ${businessName}`,
    html: emailShell('Your post is ready! 🎉', body),
  });
}

// ─── Post published ───────────────────────────────────────────────────────────

export async function sendPostPublishedEmail({
  to,
  businessName,
  platforms,
  imageUrl,
}: {
  to: string;
  businessName: string;
  platforms: string[];
  imageUrl?: string | null;
}) {
  const platformList = platforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social`;

  const body = `
    <p style="color:#6b7280;">Great news! Your post for <strong>${businessName}</strong> has been published.</p>
    ${imageUrl ? `<div style="margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <img src="${imageUrl}" alt="Published post" style="width:100%;display:block;max-height:280px;object-fit:cover;" />
    </div>` : ''}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
      <p style="color:#15803d;font-size:14px;font-weight:600;margin:0;">✅ Published to: ${platformList}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;">Your audience is seeing your content right now. Check your dashboard for performance data.</p>
    ${ctaButton('View Dashboard', dashboardUrl, '#16a34a')}
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your post is live on ${platformList}! 🚀`,
    html: emailShell("Your post is live! 🚀", body),
  });
}

// ─── Post approved confirmation ───────────────────────────────────────────────

export async function sendPostApprovedEmail({
  to,
  businessName,
  platforms,
}: {
  to: string;
  businessName: string;
  platforms: string[];
}) {
  const platformList = platforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social`;

  const body = `
    <p style="color:#6b7280;">You approved your post for <strong>${businessName}</strong>. We're publishing it to ${platformList} now.</p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="color:#1d4ed8;font-size:14px;margin:0;">⏳ Publishing usually completes within a few minutes. You'll get another email once it's live.</p>
    </div>
    ${ctaButton('View Your Posts', dashboardUrl, '#6366f1')}
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Post approved — going live on ${platformList} now`,
    html: emailShell('Post approved! ✅', body),
  });
}

// ─── Onboarding complete / first post generating ──────────────────────────────

export async function sendOnboardingCompleteEmail({
  to,
  firstName,
  businessName,
}: {
  to: string;
  firstName: string;
  businessName: string;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  const socialUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`;

  const body = `
    <p style="color:#6b7280;">Welcome aboard, <strong>${firstName}</strong>! Your PulseCommand account for <strong>${businessName}</strong> is active and your first post is being generated right now.</p>
    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;margin:20px 0;">
      <h3 style="color:#7c3aed;margin-top:0;font-size:16px;">What happens next:</h3>
      <ol style="color:#6b7280;line-height:2;margin:0;padding-left:20px;">
        <li>Your first AI-generated post will be ready within minutes</li>
        <li>You'll get an email to review and approve it</li>
        <li>Connect your social accounts so we can publish for you</li>
        <li>Every week, new content will be generated automatically</li>
      </ol>
    </div>
    ${ctaButton('Go to Dashboard', dashboardUrl)}
    <p style="text-align:center;margin-top:8px;">
      <a href="${socialUrl}" style="color:#6366f1;font-size:14px;text-decoration:none;">Connect social accounts →</a>
    </p>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Welcome to PulseCommand, ${firstName}! Your first post is generating 🎉`,
    html: emailShell(`Welcome, ${firstName}! 🎉`, body),
  });
}

// ─── Brand Strategy Plan ready for review ────────────────────────────────────

export async function sendStrategyEmail({
  to,
  firstName,
  strategyHTML,
}: {
  to: string;
  firstName: string;
  businessName: string;
  strategyHTML: string;
  clientId: string;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/strategy`;

  const body = `
    <p style="color:#6b7280;">Hi ${firstName}, your personalized Brand Strategy Plan has been created based on your interview with our AI.</p>

    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin:20px 0;">
      <h3 style="color:#0369a1;margin-top:0;">📋 Your Strategy Includes:</h3>
      <ul style="color:#0c4a6e;margin:10px 0;">
        <li>Business overview & value proposition</li>
        <li>Target audience analysis</li>
        <li>5 content pillars for your strategy</li>
        <li>Channel & posting recommendations</li>
        <li>Brand tone & voice guidelines</li>
        <li>Success metrics & timeline</li>
      </ul>
    </div>

    <p style="color:#6b7280;">Review your complete strategy below, make any edits you'd like in your dashboard, then approve to start generating content.</p>

    <div style="border-top:2px solid #e5e7eb;border-bottom:2px solid #e5e7eb;padding:20px 0;margin:20px 0;">
      ${strategyHTML}
    </div>

    ${ctaButton('Review & Approve Strategy', dashboardUrl, '#6366f1')}

    <p style="color:#9ca3af;font-size:13px;">Once you approve, we'll start generating your first batch of content tailored to this strategy within 24 hours.</p>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your Brand Strategy Plan is ready, ${firstName}!`,
    html: emailShell('Your Brand Strategy Plan 📊', body),
  });
}

export async function sendSMSNotification(message: string) {
  // Slack fallback for internal notifications
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
  }
}
