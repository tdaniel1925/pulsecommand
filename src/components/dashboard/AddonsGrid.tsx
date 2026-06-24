'use client';

import { useState } from 'react';
import { Check, Plus, Loader2, Zap, ExternalLink } from 'lucide-react';

interface Addon {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_type: 'one_time' | 'monthly';
  stripe_price_id?: string | null;
  isActive: boolean;
}

function formatPrice(cents: number, billingType: string) {
  const dollars = (cents / 100).toFixed(0);
  return billingType === 'monthly' ? `$${dollars}/mo` : `$${dollars}`;
}

const ADDON_ICONS: Record<string, string> = {
  lead_magnet: '📄',
  newsletter: '📧',
  extra_social: '📱',
  landing_page: '🌐',
  extra_video: '🎬',
  extra_audio: '🎙️',
};

const ADDON_BENEFITS: Record<string, string[]> = {
  lead_magnet: ['AI-generated PDF guide', 'Branded with your colors', 'Shareable download link'],
  newsletter: ['Monthly email draft', 'Approve before sending', 'Sent to your list'],
  extra_social: ['+50 posts per month', 'All platforms covered', 'Auto-scheduled'],
  landing_page: ['AI-built page', 'Deployed to live URL', 'Lead capture form'],
  extra_video: ['+2 HeyGen videos/mo', 'Your AI avatar', 'Script included'],
  extra_audio: ['+2 podcast episodes/mo', 'Your AI voice', 'Ready to publish'],
};

export function AddonsGrid({ addons }: { addons: Addon[] }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(
    new Set(addons.filter((a) => a.isActive).map((a) => a.key))
  );
  const [message, setMessage] = useState<string | null>(null);

  const handleAdd = async (addon: Addon) => {
    setLoadingKey(addon.key);
    setMessage(null);
    try {
      // If addon has a Stripe price, redirect to checkout
      if (addon.stripe_price_id) {
        const res = await fetch('/api/stripe/addon-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addonKey: addon.key, stripePriceId: addon.stripe_price_id }),
        });
        const data = await res.json() as { url?: string; error?: string };
        if (data.url) { window.location.assign(data.url); return; }
        setMessage(data.error ?? 'Failed to start checkout.');
      } else {
        // No Stripe price — manual request
        const res = await fetch('/api/client/addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addonKey: addon.key }),
        });
        const data = await res.json() as { message?: string; error?: string };
        if (res.ok) {
          setActiveKeys((prev) => new Set([...prev, addon.key]));
          setMessage(data.message ?? "Add-on requested — we'll activate it within 24 hours.");
        } else {
          setMessage(data.error ?? 'Something went wrong.');
        }
      }
    } catch {
      setMessage('Failed to request add-on. Please try again.');
    } finally {
      setLoadingKey(null);
    }
  };

  if (addons.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center">
        <Zap className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
        <p className="font-medium text-neutral-700">No add-ons available yet</p>
        <p className="text-sm text-neutral-400 mt-1">Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl px-4 py-3">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {addons.map((addon) => {
          const isActive = activeKeys.has(addon.key);
          const isLoading = loadingKey === addon.key;
          const icon = ADDON_ICONS[addon.key] ?? '⚡';
          const benefits = ADDON_BENEFITS[addon.key] ?? [];

          return (
            <div
              key={addon.key}
              className={`relative bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
                isActive
                  ? 'border-green-200 shadow-sm shadow-green-50'
                  : 'border-neutral-200 shadow-sm hover:shadow-md hover:border-primary-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <Check className="w-3 h-3" /> Active
                </span>
              )}

              <div className="flex items-start gap-3 pr-16">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">{addon.name}</h3>
                  <p className="text-neutral-500 text-xs leading-relaxed mt-0.5">{addon.description}</p>
                </div>
              </div>

              {benefits.length > 0 && (
                <ul className="space-y-1.5">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-neutral-600">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 mt-auto">
                <div>
                  <span className="text-lg font-bold text-neutral-900">
                    {formatPrice(addon.price_cents, addon.billing_type)}
                  </span>
                  <span className="text-xs text-neutral-400 ml-1">
                    {addon.billing_type === 'monthly' ? 'per month' : 'one-time'}
                  </span>
                </div>

                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                    <Check className="w-3.5 h-3.5" /> Enabled
                  </span>
                ) : (
                  <button
                    onClick={() => handleAdd(addon)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                     addon.stripe_price_id ? <ExternalLink className="w-3.5 h-3.5" /> :
                     <Plus className="w-3.5 h-3.5" />}
                    {addon.stripe_price_id ? 'Subscribe' : 'Request'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-neutral-400 text-center pt-2">
        Add-ons are billed separately and can be cancelled anytime from your billing settings.
      </p>
    </div>
  );
}
