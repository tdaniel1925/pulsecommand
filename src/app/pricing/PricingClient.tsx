'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Plan } from '@/lib/stripe'

interface Props {
  plans: Plan[]
}

const FAQ_ITEMS = [
  {
    q: 'How does it work?',
    a: 'You do one short interview about your business. After that, we write your social posts, create an image for each, and publish them to your connected accounts automatically — no approvals or scheduling needed.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, cancel from your dashboard settings. No questions asked.',
  },
  {
    q: 'What happens after my free trial?',
    a: 'You keep any content already generated. Continue your subscription to keep new posts publishing every month.',
  },
  {
    q: 'What social platforms are supported?',
    a: 'Instagram, Facebook, LinkedIn, X (Twitter), and TikTok, with more available.',
  },
  {
    q: 'Do I have to approve each post?',
    a: 'No. Posts are published automatically on your schedule. The whole point is that it runs hands-off after your interview.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-neutral-100 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left gap-4"
      >
        <span className="font-medium text-neutral-800">{q}</span>
        <span className="text-neutral-400 flex-shrink-0 text-xl leading-none">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function PricingClient({ plans }: Props) {
  const router = useRouter()
  // The product is a single plan; render the first (only) active plan.
  const plan = plans[0]

  return (
    <>
      {/* Single plan */}
      <div className="max-w-md mx-auto px-8 pb-20">
        <div className="relative rounded-2xl border-2 border-indigo-500 p-8 bg-white shadow-xl shadow-indigo-100/50 flex flex-col">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Everything included
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-5xl font-black text-neutral-900">${plan.price}</span>
              <span className="text-xl text-neutral-400">/mo</span>
            </div>
            <p className="text-sm text-neutral-500">{plan.description}</p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => router.push(`/sign-up?plan=${plan.id}`)}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Get Started — ${plan.price}/mo
          </button>
          <p className="text-center text-xs mt-3 text-neutral-400">14-day free trial · Cancel anytime</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-neutral-900 mb-8 text-center">
          Frequently asked questions
        </h2>
        <div>
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </>
  )
}
