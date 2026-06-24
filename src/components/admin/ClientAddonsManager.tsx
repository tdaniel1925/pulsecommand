'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface Addon {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_type: 'one_time' | 'monthly';
  active: boolean;
}

interface ClientAddon {
  addon_key: string;
  status: string;
  addons: Addon;
}

function formatPrice(cents: number, billingType: string) {
  const dollars = (cents / 100).toFixed(0);
  return billingType === 'monthly' ? `$${dollars}/mo` : `$${dollars}`;
}

export function ClientAddonsManager({ clientId }: { clientId: string }) {
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogRes, clientRes] = await Promise.all([
        fetch('/api/admin/addons'),
        fetch(`/api/admin/clients/${clientId}/addons`),
      ]);

      const catalogData = await catalogRes.json() as { addons?: Addon[] };
      const clientData = await clientRes.json() as { addons?: ClientAddon[] };

      setAllAddons(catalogData.addons ?? []);
      setActiveKeys(new Set((clientData.addons ?? []).map((a) => a.addon_key)));
    } catch {
      setError('Failed to load add-ons');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void Promise.resolve().then(() => { void fetchData(); });
  }, [fetchData]);

  const toggle = async (addonKey: string, currentlyActive: boolean) => {
    setLoadingKey(addonKey);
    setError(null);

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/addons`, {
        method: currentlyActive ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonKey }),
      });

      if (res.ok) {
        setActiveKeys((prev) => {
          const next = new Set(prev);
          if (currentlyActive) {
            next.delete(addonKey);
          } else {
            next.add(addonKey);
          }
          return next;
        });
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoadingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-4">Add-ons</h2>
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading add-ons...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
      <h2 className="text-base font-semibold text-neutral-900">Add-ons</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {allAddons.map((addon) => {
          const isActive = activeKeys.has(addon.key);
          const isLoading = loadingKey === addon.key;

          return (
            <div
              key={addon.key}
              className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
                isActive ? 'border-green-200 bg-green-50' : 'border-neutral-100 bg-neutral-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{addon.name}</p>
                  <span className="text-xs text-neutral-500">
                    {formatPrice(addon.price_cents, addon.billing_type)}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    addon.billing_type === 'monthly'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {addon.billing_type === 'monthly' ? 'monthly' : 'one-time'}
                  </span>
                </div>
                {addon.description && (
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{addon.description}</p>
                )}
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggle(addon.key, isActive)}
                disabled={isLoading}
                role="switch"
                aria-checked={isActive}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${
                  isActive ? 'bg-green-500' : 'bg-neutral-300'
                }`}
              >
                {isLoading ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  </span>
                ) : (
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
