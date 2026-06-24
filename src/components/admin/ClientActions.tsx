"use client"
import { useState } from "react"
import { MessageSquare, Zap, GitBranch } from "lucide-react"

export function ClientActions({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [showSMS, setShowSMS] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function sendSMS() {
    if (!message.trim()) return
    setLoading("sms")
    try {
      const res = await fetch(`/api/clients/${clientId}/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (data.success) {
        setResult("SMS sent!")
        setShowSMS(false)
        setMessage("")
      } else {
        setResult(data.error ?? "SMS failed")
      }
    } catch {
      setResult("SMS failed")
    } finally {
      setLoading(null)
      setTimeout(() => setResult(null), 3000)
    }
  }

  async function generateContent() {
    setLoading("social")
    try {
      const res = await fetch("/api/pipeline/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      setResult(data.success ? "Post generation started!" : data.error ?? "Failed")
    } catch {
      setResult("Request failed")
    } finally {
      setLoading(null)
      setTimeout(() => setResult(null), 4000)
    }
  }

  return (
    <div className="space-y-3">
      {result && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {result}
        </div>
      )}

      {showSMS && (
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your SMS message..."
            className="w-full text-sm border border-neutral-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={sendSMS}
              disabled={loading === "sms"}
              className="flex-1 text-sm bg-primary-600 text-white rounded-lg py-1.5 font-medium disabled:opacity-60"
            >
              {loading === "sms" ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => setShowSMS(false)}
              className="flex-1 text-sm border border-neutral-200 rounded-lg py-1.5 font-medium text-neutral-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowSMS(true)}
        className="w-full flex items-center gap-2 text-sm font-medium border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-50 transition-colors text-neutral-700"
      >
        <MessageSquare className="w-4 h-4 text-neutral-400" />
        Send SMS
      </button>

      <button
        onClick={() => generateContent()}
        disabled={!!loading}
        className="w-full flex items-center gap-2 text-sm font-medium border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-50 transition-colors text-neutral-700 disabled:opacity-60"
      >
        <Zap className="w-4 h-4 text-blue-500" />
        {loading === "social" ? "Generating..." : "Generate Social Posts"}
      </button>

      <a
        href={`/admin/pipeline`}
        className="w-full flex items-center gap-2 text-sm font-medium border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-50 transition-colors text-neutral-700"
      >
        <GitBranch className="w-4 h-4 text-neutral-400" />
        View Pipeline
      </a>
    </div>
  )
}
