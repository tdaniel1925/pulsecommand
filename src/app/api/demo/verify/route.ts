import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// POST /api/demo/verify — send verification email
export async function POST(request: NextRequest) {
  try {
    const { demoId } = await request.json()
    if (!demoId) return NextResponse.json({ error: 'Missing demoId' }, { status: 400 })

    const admin = createAdminClient()
    const { data: demo } = await admin
      .from('demo_requests')
      .select('id, name, email, email_verified')
      .eq('id', demoId)
      .single()

    if (!demo) return NextResponse.json({ error: 'Demo not found' }, { status: 404 })
    if (demo.email_verified) return NextResponse.json({ alreadyVerified: true })

    // Generate a short token
    const token = Buffer.from(`${demoId}:${Date.now()}`).toString('base64url')
    await admin.from('demo_requests').update({ verify_token: token }).eq('id', demoId)

    const verifyUrl = `${BASE_URL}/demo/verify?token=${token}`
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BundledContent <hello@bundledcontent.com>',
        to: demo.email,
        subject: `${demo.name}, verify your email to unlock your custom AI video`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#4f46e5,#4338ca);padding:40px 32px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:26px;">🎬 Unlock Your Custom AI Video</h1>
              <p style="color:#c7d2fe;margin:10px 0 0;">One click — we'll render a personalized HeyGen video for your brand</p>
            </div>
            <div style="padding:32px;">
              <p style="color:#374151;font-size:16px;">Hi ${demo.name},</p>
              <p style="color:#6b7280;">Click the button below to verify your email. We'll immediately start rendering your custom AI presenter video — featuring your actual brand, services, and message.</p>
              <a href="${verifyUrl}" style="display:block;background:#4f46e5;color:white;padding:18px;border-radius:12px;text-decoration:none;font-weight:bold;text-align:center;font-size:16px;margin:24px 0;">
                Verify Email & Unlock My Video →
              </a>
              <p style="color:#9ca3af;font-size:13px;">Or paste this link in your browser:<br/><span style="color:#4f46e5;">${verifyUrl}</span></p>
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">BundledContent · AI Marketing on Autopilot</p>
            </div>
          </div>
        `,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('demo/verify POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/demo/verify?token=xxx — confirm token, trigger HeyGen
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const admin = createAdminClient()
    const { data: demo } = await admin
      .from('demo_requests')
      .select('id, email_verified')
      .eq('verify_token', token)
      .single()

    if (!demo) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

    // Mark verified
    await admin.from('demo_requests').update({ email_verified: true }).eq('id', demo.id)

    // Redirect to results page
    return NextResponse.redirect(`${BASE_URL}/demo/results/${demo.id}?verified=1`)
  } catch (err) {
    console.error('demo/verify GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
