'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PLANS } from '@/lib/stripe'

type Plans = typeof PLANS

interface Props {
  plans: Plans
}

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, cancel from your dashboard settings. No questions asked.',
  },
  {
    q: 'What happens after my free trial?',
    a: 'You keep your generated content. Upgrade to continue creating new posts and landing pages.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes — pay annually and save 20%.',
  },
  {
    q: 'What social platforms are supported?',
    a: 'Instagram, Facebook, LinkedIn, X (Twitter), and Google Business.',
  },
  {
    q: 'Can I upgrade or downgrade?',
    a: 'Yes, plan changes take effect immediately and are prorated.',
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
  const [annual, setAnnual] = useState(false)
  const router = useRouter()

  async function handleGetStarted(planId: string) {
    router.push(`/login?plan=${planId}`)
  }

  const planList = Object.values(plans)

  return (
    <>
      {/* Annual toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!annual ? 'text-neutral-900' : 'text-neutral-400'}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            annual ? 'bg-indigo-600' : 'bg-neutral-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              annual ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-neutral-900' : 'text-neutral-400'}`}>
          Annual
          <span className="ml-1.5 inline-block text-xs font-semibold text-green-600 bg-green-50 rounded-full px-2 py-0.5">
            Save 20%
          </span>
        </span>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-8 pb-20">
        {planList.map((plan) => {
          const displayPrice = annual ? Math.round(plan.price * 0.8) : plan.price
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 bg-white shadow-sm flex flex-col ${
                plan.highlight
                  ? 'border-indigo-500 shadow-xl shadow-indigo-100/50'
                  : 'border-neutral-200'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-5xl font-black text-neutral-900">${displayPrice}</span>
                  <span className="text-xl text-neutral-400">/mo</span>
                  {annual && (
                    <span className="ml-2 text-xs text-neutral-400 line-through">${plan.price}</span>
                  )}
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
                onClick={() => handleGetStarted(plan.id)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border-2 border-neutral-200 text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                Get Started
              </button>
            </div>
          )
        })}
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
