"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Check,
  Play,
  Presentation,
  AlertTriangle,
  Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type NotificationType =
  | 'post_ready'
  | 'post_published'
  | 'video_ready'
  | 'presentation_ready'
  | 'payment_failed'
  | 'welcome'

interface Notification {
  id: string
  client_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function TypeIcon({ type }: { type: NotificationType }) {
  const base = 'w-4 h-4'
  switch (type) {
    case 'post_ready':
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0">
          <Bell className={`${base} text-indigo-600`} />
        </span>
      )
    case 'post_published':
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 flex-shrink-0">
          <Check className={`${base} text-green-600`} />
        </span>
      )
    case 'video_ready':
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 flex-shrink-0">
          <Play className={`${base} text-purple-600`} />
        </span>
      )
    case 'presentation_ready':
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 flex-shrink-0">
          <Presentation className={`${base} text-blue-600`} />
        </span>
      )
    case 'payment_failed':
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 flex-shrink-0">
          <AlertTriangle className={`${base} text-red-600`} />
        </span>
      )
    case 'welcome':
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 flex-shrink-0">
          <Star className={`${base} text-yellow-500`} />
        </span>
      )
  }
}

export default function NotificationBell({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id?: string) {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : {}),
      })
      if (id) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch {
      // silently fail
    }
  }

  function handleToggle() {
    const opening = !open
    setOpen(opening)
    if (opening && unreadCount > 0) {
      markReadTimerRef.current = setTimeout(() => {
        markRead()
      }, 2000)
    } else if (!opening && markReadTimerRef.current) {
      clearTimeout(markReadTimerRef.current)
    }
  }

  function handleNotificationClick(n: Notification) {
    if (!n.read) markRead(n.id)
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Initial fetch + 30s poll
  useEffect(() => {
    const run = () => { void fetchNotifications() }
    void Promise.resolve().then(run)
    const interval = setInterval(run, 30000)
    return () => clearInterval(interval)
  }, [])

  // Supabase realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [clientId])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current)
    }
  }, [])

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-neutral-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="text-sm font-semibold text-neutral-900">Notifications</span>
            <button
              onClick={() => markRead()}
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Mark all read
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-400">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center gap-2 text-neutral-400">
                <Bell className="w-8 h-8 opacity-30" />
                <span className="text-sm">No notifications yet</span>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 ${
                    !n.read
                      ? 'bg-indigo-50/50 border-l-2 border-indigo-500'
                      : 'bg-white'
                  }`}
                >
                  <TypeIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{n.body}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length >= 20 && (
            <div className="px-4 py-2 border-t border-neutral-100 text-center">
              <span className="text-sm text-indigo-600">View all</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
