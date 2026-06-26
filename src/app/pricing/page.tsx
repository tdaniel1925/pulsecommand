import { ACTIVE_PLANS } from '@/lib/stripe'
import PricingClient from './PricingClient'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="text-center py-20 bg-gradient-to-b from-indigo-50 to-white px-8">
        <h1 className="text-5xl font-bold text-neutral-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-neutral-500">
          One plan. Everything included. Cancel anytime.
        </p>
      </div>

      {/* Plan */}
      <PricingClient plans={ACTIVE_PLANS} />

      {/* Footer */}
      <div className="text-center py-8 border-t border-neutral-100">
        <p className="text-sm text-neutral-400">&copy; {new Date().getFullYear()} BundledContent</p>
      </div>
    </div>
  )
}
