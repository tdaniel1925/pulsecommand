'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import OnboardingNav from '@/components/OnboardingNav'
import {
  Globe, Loader2, CheckCircle2, Pencil, Upload, ArrowRight,
  ImageIcon, Palette, Mic2, Building2, Sparkles, Tag, Users, Star,
} from 'lucide-react'

const TONE_OPTIONS = ['Professional', 'Friendly', 'Bold', 'Authoritative', 'Casual', 'Inspirational', 'Warm', 'Technical']

const INDUSTRIES = [
  'Healthcare', 'Finance', 'Real Estate', 'Fitness & Wellness',
  'Food & Beverage', 'Legal', 'Education', 'Technology',
  'Retail', 'Home Services', 'Beauty & Personal Care',
  'Consulting', 'Construction', 'Insurance', 'Other',
]

interface ScanData {
  businessName?: string
  tagline?: string
  description?: string
  industry?: string
  primaryColor?: string
  secondaryColor?: string
  toneOfVoice?: string
  logoUrl?: string
  targetAudience?: string
  uniqueValueProp?: string
  contentPillars?: string[]
  keywords?: string[]
  services?: string[]
  usedScreenshot?: boolean
  pagesScanned?: number
}

const SCAN_STEPS = [
  'Fetching your website…',
  'Taking a screenshot…',
  'Scanning additional pages…',
  'Analysing brand with Claude AI…',
  'Extracting colors and logo…',
]

export default function BrandAssetsPage() {
  const router = useRouter()

  const [websiteUrl, setWebsiteUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [scanned, setScanned] = useState(false)
  const [scanData, setScanData] = useState<ScanData | null>(null)
  const [scanError, setScanError] = useState('')
  const [editingScan, setEditingScan] = useState(false)

  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [secondaryColor, setSecondaryColor] = useState('#1e40af')

  const [, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('')
  const [logoStorageUrl, setLogoStorageUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [useScannedLogo, setUseScannedLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [toneOfVoice, setToneOfVoice] = useState('')
  const [industry, setIndustry] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [uniqueValueProp, setUniqueValueProp] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleScan() {
    if (!websiteUrl.trim()) return
    setScanning(true)
    setScanError('')
    setScanStep(0)

    // Animate through steps while waiting
    const stepInterval = setInterval(() => {
      setScanStep(s => Math.min(s + 1, SCAN_STEPS.length - 1))
    }, 2500)

    try {
      const res = await fetch('/api/onboarding/scan-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      })
      const json = await res.json()
      clearInterval(stepInterval)

      if (!res.ok || !json.success) {
        setScanError(json.error ?? 'Scan failed. Please try again.')
      } else {
        const d: ScanData = json.data
        setScanData(d)
        setScanned(true)
        setEditingScan(false)

        // Auto-populate all fields from scan
        if (d.primaryColor) setPrimaryColor(d.primaryColor)
        if (d.secondaryColor) setSecondaryColor(d.secondaryColor)
        if (d.description) setBusinessDescription(d.description)
        if (d.targetAudience) setTargetAudience(d.targetAudience)
        if (d.uniqueValueProp) setUniqueValueProp(d.uniqueValueProp)
        if (d.toneOfVoice) {
          const matched = TONE_OPTIONS.find(t => t.toLowerCase() === d.toneOfVoice?.toLowerCase())
          if (matched) setToneOfVoice(matched)
        }
        if (d.industry) {
          const matched = INDUSTRIES.find(i => i.toLowerCase().includes(d.industry?.toLowerCase() ?? ''))
          if (matched) setIndustry(matched)
        }
      }
    } catch {
      clearInterval(stepInterval)
      setScanError('Scan failed. Check your connection and try again.')
    } finally {
      setScanning(false)
    }
  }

  async function handleLogoFile(file: File) {
    setLogoFile(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
    setUseScannedLogo(false)
    setUploadingLogo(true)
    try {
      const form = new FormData()
      form.append('logo', file)
      const res = await fetch('/api/onboarding/upload-logo', { method: 'POST', body: form })
      const json = await res.json()
      if (json.success && json.url) setLogoStorageUrl(json.url)
    } catch { /* keep local preview */ } finally {
      setUploadingLogo(false)
    }
  }

  async function handleContinue() {
    setSaving(true)
    setSaveError('')
    try {
      const effectiveLogoUrl = useScannedLogo ? scanData?.logoUrl ?? '' : logoStorageUrl
      const res = await fetch('/api/onboarding/save-brand-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          logoUrl: effectiveLogoUrl,
          businessDescription,
          tagline: scanData?.tagline ?? '',
          industry,
          website: websiteUrl.trim() || undefined,
          toneOfVoice,
          targetAudience,
          uniqueValueProp,
          contentPillars: scanData?.contentPillars ?? [],
          keywords: scanData?.keywords ?? [],
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setSaveError(json.error ?? 'Could not save. Please try again.')
        setSaving(false)
        return
      }
      router.push('/onboarding/complete')
    } catch {
      setSaveError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const effectiveLogoPreview = useScannedLogo ? scanData?.logoUrl : logoPreviewUrl || undefined

  return (
    <>
      <OnboardingNav current="brand-assets" />

      <main className="min-h-screen bg-neutral-50">
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 py-12 px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Set Up Your Brand</h1>
          <p className="text-primary-100 text-base max-w-xl mx-auto">
            We scan your website with AI to extract your brand identity automatically — then you refine it.
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

          {/* Section 1: Website Scan */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-bold text-neutral-900">Scan Your Website</h2>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              We&apos;ll scan your homepage, about page, and services page — then use Claude AI + vision to extract your brand automatically.
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !scanning && handleScan()}
                placeholder="https://yourbusiness.com"
                className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleScan}
                disabled={scanning || !websiteUrl.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</> : <><Sparkles className="w-4 h-4" /> Scan Site</>}
              </button>
            </div>

            {/* Scan progress */}
            {scanning && (
              <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-4 h-4 text-primary-600 animate-spin flex-shrink-0" />
                  <span className="text-sm font-medium text-primary-800">{SCAN_STEPS[scanStep]}</span>
                </div>
                <div className="w-full bg-primary-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-600 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-primary-600 mt-2">This takes 15–30 seconds — we&apos;re scanning multiple pages</p>
              </div>
            )}

            {scanError && <p className="mt-2 text-xs text-red-600">{scanError}</p>}

            {/* Scan results */}
            {scanned && scanData && !editingScan && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-800">
                      Scanned {scanData.pagesScanned ?? 1} page{(scanData.pagesScanned ?? 1) > 1 ? 's' : ''}
                      {scanData.usedScreenshot ? ' + visual analysis' : ''}
                    </span>
                  </div>
                  <button onClick={() => setEditingScan(true)} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {scanData.businessName && (
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-neutral-500 mb-0.5">Business Name</p>
                      <p className="text-sm font-semibold text-neutral-800">{scanData.businessName}</p>
                    </div>
                  )}
                  {scanData.tagline && (
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-neutral-500 mb-0.5">Tagline</p>
                      <p className="text-sm font-semibold text-neutral-800">{scanData.tagline}</p>
                    </div>
                  )}
                  {scanData.industry && (
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-neutral-500 mb-0.5">Industry</p>
                      <p className="text-sm font-semibold text-neutral-800">{scanData.industry}</p>
                    </div>
                  )}
                  {scanData.toneOfVoice && (
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-neutral-500 mb-0.5">Tone of Voice</p>
                      <p className="text-sm font-semibold text-neutral-800 capitalize">{scanData.toneOfVoice}</p>
                    </div>
                  )}
                </div>

                {scanData.description && (
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-neutral-500 mb-0.5">Description</p>
                    <p className="text-xs text-neutral-700 leading-relaxed">{scanData.description}</p>
                  </div>
                )}

                {scanData.targetAudience && (
                  <div className="bg-white rounded-lg p-3 border border-green-100 flex gap-2">
                    <Users className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-neutral-500 mb-0.5">Target Audience</p>
                      <p className="text-xs text-neutral-700">{scanData.targetAudience}</p>
                    </div>
                  </div>
                )}

                {scanData.uniqueValueProp && (
                  <div className="bg-white rounded-lg p-3 border border-green-100 flex gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-neutral-500 mb-0.5">Unique Value Proposition</p>
                      <p className="text-xs text-neutral-700">{scanData.uniqueValueProp}</p>
                    </div>
                  </div>
                )}

                {scanData.contentPillars && scanData.contentPillars.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-neutral-500 mb-2">Content Pillars</p>
                    <div className="flex flex-wrap gap-1.5">
                      {scanData.contentPillars.map((p) => (
                        <span key={p} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full border border-primary-100">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {scanData.keywords && scanData.keywords.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Tag className="w-3 h-3 text-neutral-400" />
                      <p className="text-xs text-neutral-500">Keywords</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scanData.keywords.map((k) => (
                        <span key={k} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(scanData.primaryColor || scanData.secondaryColor) && (
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-neutral-500 mb-2">Brand Colors Detected</p>
                    <div className="flex gap-3">
                      {scanData.primaryColor && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full border border-neutral-200" style={{ backgroundColor: scanData.primaryColor }} />
                          <span className="text-xs font-mono text-neutral-700">{scanData.primaryColor}</span>
                          <span className="text-xs text-neutral-400">Primary</span>
                        </div>
                      )}
                      {scanData.secondaryColor && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full border border-neutral-200" style={{ backgroundColor: scanData.secondaryColor }} />
                          <span className="text-xs font-mono text-neutral-700">{scanData.secondaryColor}</span>
                          <span className="text-xs text-neutral-400">Secondary</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {scanData.logoUrl && (
                  <div className="bg-white rounded-lg p-3 border border-green-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Image src={scanData.logoUrl} alt="Detected logo" width={80} height={32} className="h-8 w-auto object-contain rounded border border-neutral-200 bg-neutral-50 px-1" unoptimized />
                      <p className="text-xs text-neutral-500">Logo / OG image found</p>
                    </div>
                    <button
                      onClick={() => setUseScannedLogo(!useScannedLogo)}
                      className={`text-xs px-3 py-1 rounded-lg font-semibold border transition-colors ${useScannedLogo ? 'bg-primary-600 text-white border-primary-600' : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'}`}
                    >
                      {useScannedLogo ? 'Using this ✓' : 'Use as logo'}
                    </button>
                  </div>
                )}

                <button
                  onClick={handleScan}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Re-scan website →
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Brand Colors */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-bold text-neutral-900">Brand Colors</h2>
            </div>
            <p className="text-xs text-neutral-500 mb-5">Auto-filled from your website scan. Adjust if needed.</p>

            <div className="space-y-4">
              {['Primary', 'Secondary'].map((label) => {
                const val = label === 'Primary' ? primaryColor : secondaryColor
                const setVal = label === 'Primary' ? setPrimaryColor : setSecondaryColor
                return (
                  <div key={label}>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">{label} Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={val} onChange={(e) => setVal(e.target.value)}
                        className="w-12 h-10 rounded-lg border border-neutral-200 cursor-pointer p-0.5 bg-white" />
                      <input type="text" value={val} onChange={(e) => setVal(e.target.value)} maxLength={7}
                        className="w-32 px-3 py-2 border border-neutral-200 rounded-xl text-sm font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="#2563eb" />
                      <div className="w-10 h-10 rounded-xl border border-neutral-200 flex-shrink-0" style={{ backgroundColor: val }} />
                      <span className="text-xs text-neutral-400">{label === 'Primary' ? 'Buttons, headers, CTAs' : 'Accents, backgrounds'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 3: Logo Upload */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-bold text-neutral-900">Your Logo</h2>
            </div>
            <p className="text-xs text-neutral-500 mb-5">Upload your logo file (PNG, SVG, or JPG).</p>

            <div
              onClick={() => !uploadingLogo && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleLogoFile(f) }}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${uploadingLogo ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed' : 'border-neutral-300 hover:border-primary-400 hover:bg-primary-50'}`}
            >
              {uploadingLogo ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  <p className="text-sm text-neutral-500">Uploading…</p>
                </div>
              ) : effectiveLogoPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <Image src={effectiveLogoPreview} alt="Logo preview" width={160} height={60} className="max-h-16 w-auto object-contain" unoptimized />
                  <p className="text-xs text-neutral-500">Click to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-neutral-400" />
                  <p className="text-sm font-medium text-neutral-700">Drop your logo here or <span className="text-primary-600">browse</span></p>
                  <p className="text-xs text-neutral-400">PNG, SVG, JPG — max 5MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }} />
          </div>

          {/* Section 4: Business Description */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-bold text-neutral-900">About Your Business</h2>
            </div>
            <p className="text-xs text-neutral-500 mb-4">Auto-filled from scan. Edit to be more specific.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Business Description</label>
                <textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={3}
                  placeholder="What does your business do and who do you serve?"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Small business owners aged 35-55 in the US"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">What Makes You Different</label>
                <input
                  type="text"
                  value={uniqueValueProp}
                  onChange={(e) => setUniqueValueProp(e.target.value)}
                  placeholder="e.g. Only firm that offers same-day service with a satisfaction guarantee"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Brand Voice */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Mic2 className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-bold text-neutral-900">Brand Voice</h2>
            </div>
            <p className="text-xs text-neutral-500 mb-4">How do you want to sound? Auto-detected from your site — confirm or change.</p>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => (
                <button key={tone} onClick={() => setToneOfVoice(tone === toneOfVoice ? '' : tone)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${toneOfVoice === tone ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-300 hover:text-primary-700'}`}>
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Section 6: Industry */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-bold text-neutral-900">Industry</h2>
            </div>
            <p className="text-xs text-neutral-500 mb-4">Auto-detected — confirm or select the best fit.</p>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select your industry…</option>
              {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{saveError}</div>
          )}

          <div className="flex justify-end pb-10">
            <button onClick={handleContinue} disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-sm">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Finish Setup <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
