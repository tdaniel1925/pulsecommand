'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Post {
  id: string
  client_id: string
  content: string | null
  image_url: string | null
  platforms: string[]
  status: string
  created_at: string
  scheduled_at: string | null
  published_at: string | null
  metadata: Record<string, unknown> | null
}

interface Props {
  generating: Post[]
  pending: Post[]
  scheduled: Post[]
  published: Post[]
  failed: Post[]
  clientMap: Record<string, string>
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="inline-block text-[10px] font-medium bg-neutral-100 text-neutral-500 rounded px-1.5 py-0.5 mr-1 mb-1">
      {platform}
    </span>
  )
}

function PostCard({
  post,
  clientMap,
  onClick,
  showCheckbox,
  checked,
  onCheckChange,
}: {
  post: Post
  clientMap: Record<string, string>
  onClick: () => void
  showCheckbox: boolean
  checked: boolean
  onCheckChange: (id: string) => void
}) {
  const clientName = clientMap[post.client_id] ?? post.client_id
  const displayDate = post.published_at ?? post.scheduled_at ?? post.created_at

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow relative"
    >
      {showCheckbox && (
        <input
          type="checkbox"
          checked={checked}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation()
            onCheckChange(post.id)
          }}
          className="absolute top-2 right-2 w-4 h-4 cursor-pointer"
        />
      )}
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-bold text-neutral-800 truncate max-w-[70%]">{clientName}</span>
        <div className="flex flex-wrap justify-end">
          {Array.isArray(post.platforms) && post.platforms.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
        </div>
      </div>
      <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
        {post.content ?? <span className="italic text-neutral-400">No caption</span>}
      </p>
      <span className="text-xs text-neutral-400">{formatDate(displayDate)}</span>
    </div>
  )
}

interface ColumnProps {
  title: string
  posts: Post[]
  headerColor: string
  headerBg: string
  clientMap: Record<string, string>
  onCardClick: (post: Post) => void
  showCheckboxes?: boolean
  selectedPostIds?: Set<string>
  onCheckChange?: (id: string) => void
  showApproveAllPerClient?: boolean
  onApproveAllForClient?: (clientId: string) => void
}

function KanbanColumn({
  title,
  posts,
  headerColor,
  headerBg,
  clientMap,
  onCardClick,
  showCheckboxes = false,
  selectedPostIds = new Set(),
  onCheckChange,
  showApproveAllPerClient = false,
  onApproveAllForClient,
}: ColumnProps) {
  // Group posts by client for "Approve all" per client
  const clientGroups: Record<string, Post[]> = {}
  if (showApproveAllPerClient) {
    for (const post of posts) {
      if (!clientGroups[post.client_id]) clientGroups[post.client_id] = []
      clientGroups[post.client_id].push(post)
    }
  }

  return (
    <div className="min-w-[200px] flex flex-col bg-neutral-50 rounded-xl">
      <div className={`${headerBg} rounded-t-xl px-3 py-2.5 flex-shrink-0`}>
        <span className={`text-xs font-semibold uppercase tracking-wide ${headerColor}`}>{title}</span>
        <span className="ml-2 text-xs font-bold text-neutral-500">{posts.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {showApproveAllPerClient
          ? Object.entries(clientGroups).map(([clientId, clientPosts]) => (
              <div key={clientId} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-neutral-500 truncate">
                    {clientMap[clientId] ?? clientId}
                  </span>
                  {onApproveAllForClient && (
                    <button
                      onClick={() => onApproveAllForClient(clientId)}
                      className="text-[10px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded px-1.5 py-0.5 transition-colors flex-shrink-0 ml-1"
                    >
                      Approve all
                    </button>
                  )}
                </div>
                {clientPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    clientMap={clientMap}
                    onClick={() => onCardClick(post)}
                    showCheckbox={showCheckboxes}
                    checked={selectedPostIds.has(post.id)}
                    onCheckChange={onCheckChange ?? (() => {})}
                  />
                ))}
              </div>
            ))
          : posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                clientMap={clientMap}
                onClick={() => onCardClick(post)}
                showCheckbox={showCheckboxes}
                checked={selectedPostIds.has(post.id)}
                onCheckChange={onCheckChange ?? (() => {})}
              />
            ))}
        {posts.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-6">No posts</p>
        )}
      </div>
    </div>
  )
}

export default function AdminPipelineBoard({
  generating: initialGenerating,
  pending: initialPending,
  scheduled: initialScheduled,
  published: initialPublished,
  failed: initialFailed,
  clientMap,
}: Props) {
  const router = useRouter()

  const [generating, setGenerating] = useState(initialGenerating)
  const [pending, setPending] = useState(initialPending)
  const [scheduled, setScheduled] = useState(initialScheduled)
  const [published, setPublished] = useState(initialPublished)
  const [failed, setFailed] = useState(initialFailed)

  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedClientFilter, setSelectedClientFilter] = useState('all')
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set())
  const [drawerTab, setDrawerTab] = useState<string | null>(null)

  function removePostFromState(id: string) {
    setGenerating((prev) => prev.filter((p) => p.id !== id))
    setPending((prev) => prev.filter((p) => p.id !== id))
    setScheduled((prev) => prev.filter((p) => p.id !== id))
    setPublished((prev) => prev.filter((p) => p.id !== id))
    setFailed((prev) => prev.filter((p) => p.id !== id))
  }

  const handleApprove = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/content/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'post', id, action: 'approve' }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert('Failed: ' + (data.error ?? 'Unknown error'))
        return
      }
      removePostFromState(id)
      setSelectedPost(null)
      router.refresh()
    } catch (e: unknown) {
      alert('Failed: ' + (e instanceof Error ? e.message : String(e)))
    }
  }, [router])

  const handleReject = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/content/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'post', id, action: 'reject' }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert('Failed: ' + (data.error ?? 'Unknown error'))
        return
      }
      removePostFromState(id)
      setSelectedPost(null)
      router.refresh()
    } catch (e: unknown) {
      alert('Failed: ' + (e instanceof Error ? e.message : String(e)))
    }
  }, [router])

  function togglePostId(id: string) {
    setSelectedPostIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkAction(action: 'approve' | 'reject') {
    for (const id of Array.from(selectedPostIds)) {
      await fetch('/api/content/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'post', id, action }),
      })
      removePostFromState(id)
    }
    setSelectedPostIds(new Set())
    router.refresh()
  }

  async function handleApproveAllForClient(clientId: string) {
    const clientPending = pending.filter((p) => p.client_id === clientId)
    for (const post of clientPending) {
      await fetch('/api/content/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'post', id: post.id, action: 'approve' }),
      })
      removePostFromState(post.id)
    }
    router.refresh()
  }

  // Client filter options
  const uniqueClientIds = Array.from(
    new Set([
      ...generating,
      ...pending,
      ...scheduled,
      ...published,
      ...failed,
    ].map((p) => p.client_id))
  )

  function filterBucket(posts: Post[]) {
    if (selectedClientFilter === 'all') return posts
    return posts.filter((p) => p.client_id === selectedClientFilter)
  }

  const filteredGenerating = filterBucket(generating)
  const filteredPending = filterBucket(pending)
  const filteredScheduled = filterBucket(scheduled)
  const filteredPublished = filterBucket(published)
  const filteredFailed = filterBucket(failed)

  // Drawer: detect platform tabs
  const drawerCaptions =
    selectedPost?.metadata?.captions &&
    typeof selectedPost.metadata.captions === 'object' &&
    !Array.isArray(selectedPost.metadata.captions)
      ? (selectedPost.metadata.captions as Record<string, string>)
      : null

  const captionTabs = drawerCaptions ? Object.keys(drawerCaptions) : []
  const activeCaptionTab = drawerTab ?? captionTabs[0] ?? null

  function openDrawer(post: Post) {
    setSelectedPost(post)
    const captions =
      post.metadata?.captions &&
      typeof post.metadata.captions === 'object' &&
      !Array.isArray(post.metadata.captions)
        ? (post.metadata.captions as Record<string, string>)
        : null
    setDrawerTab(captions ? Object.keys(captions)[0] ?? null : null)
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Content Pipeline</h1>
          <p className="text-xs text-neutral-500 mt-0.5">All clients · Last 30 days</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Clients</option>
            {uniqueClientIds.map((id) => (
              <option key={id} value={id}>
                {clientMap[id] ?? id}
              </option>
            ))}
          </select>
          <button
            onClick={() => router.refresh()}
            className="text-sm font-medium border border-neutral-200 rounded-lg px-3 py-1.5 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 rounded-full px-3 py-1">
          {filteredGenerating.length} generating
        </span>
        <span className="text-xs font-semibold bg-amber-50 text-amber-600 rounded-full px-3 py-1">
          {filteredPending.length} pending approval
        </span>
        <span className="text-xs font-semibold bg-blue-50 text-blue-600 rounded-full px-3 py-1">
          {filteredScheduled.length} scheduled
        </span>
        <span className="text-xs font-semibold bg-green-50 text-green-600 rounded-full px-3 py-1">
          {filteredPublished.length} published
        </span>
        <span className="text-xs font-semibold bg-red-50 text-red-600 rounded-full px-3 py-1">
          {filteredFailed.length} failed
        </span>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto flex-1">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 min-w-full lg:min-w-[1000px] h-full">
          <KanbanColumn
            title="Generating"
            posts={filteredGenerating}
            headerColor="text-gray-500"
            headerBg="bg-gray-100"
            clientMap={clientMap}
            onCardClick={openDrawer}
          />
          <KanbanColumn
            title="Pending Approval"
            posts={filteredPending}
            headerColor="text-amber-600"
            headerBg="bg-amber-50"
            clientMap={clientMap}
            onCardClick={openDrawer}
            showCheckboxes
            selectedPostIds={selectedPostIds}
            onCheckChange={togglePostId}
            showApproveAllPerClient
            onApproveAllForClient={handleApproveAllForClient}
          />
          <KanbanColumn
            title="Scheduled"
            posts={filteredScheduled}
            headerColor="text-blue-600"
            headerBg="bg-blue-50"
            clientMap={clientMap}
            onCardClick={openDrawer}
          />
          <KanbanColumn
            title="Published"
            posts={filteredPublished}
            headerColor="text-green-600"
            headerBg="bg-green-50"
            clientMap={clientMap}
            onCardClick={openDrawer}
          />
          <KanbanColumn
            title="Failed"
            posts={filteredFailed}
            headerColor="text-red-600"
            headerBg="bg-red-50"
            clientMap={clientMap}
            onCardClick={openDrawer}
          />
        </div>
      </div>

      {/* Slide-in drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          selectedPost ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedPost && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 flex-shrink-0">
              <span className="font-bold text-neutral-900 truncate">
                {clientMap[selectedPost.client_id] ?? selectedPost.client_id}
              </span>
              <button
                onClick={() => setSelectedPost(null)}
                className="ml-3 text-neutral-400 hover:text-neutral-700 text-xl leading-none flex-shrink-0"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Platform tabs or main content */}
              {captionTabs.length > 0 ? (
                <>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {captionTabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDrawerTab(tab)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                          activeCaptionTab === tab
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                    {activeCaptionTab && drawerCaptions ? drawerCaptions[activeCaptionTab] : ''}
                  </p>
                </>
              ) : (
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                  {selectedPost.content ?? <span className="italic text-neutral-400">No content</span>}
                </p>
              )}

              {selectedPost.image_url && (
                <Image
                  src={selectedPost.image_url}
                  alt="Post image"
                  width={512}
                  height={256}
                  unoptimized
                  className="w-full rounded-lg my-4 object-cover max-h-64"
                />
              )}

              <div className="mt-4 text-xs text-neutral-400 space-y-1">
                <div>Created: {formatDate(selectedPost.created_at)}</div>
                {selectedPost.scheduled_at && (
                  <div>Scheduled: {formatDate(selectedPost.scheduled_at)}</div>
                )}
                {selectedPost.published_at && (
                  <div>Published: {formatDate(selectedPost.published_at)}</div>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.isArray(selectedPost.platforms) &&
                    selectedPost.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} />
                    ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-neutral-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => handleApprove(selectedPost.id)}
                className="flex-1 bg-green-600 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(selectedPost.id)}
                className="flex-1 bg-red-100 text-red-700 text-sm font-semibold rounded-xl py-2.5 hover:bg-red-200 transition-colors"
              >
                Reject
              </button>
            </div>
          </>
        )}
      </div>

      {/* Drawer backdrop */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSelectedPost(null)}
        />
      )}

      {/* Bulk actions bar */}
      {selectedPostIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedPostIds.size} post{selectedPostIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => handleBulkAction('approve')}
            className="text-sm font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl px-3 py-1.5 transition-colors"
          >
            Approve All
          </button>
          <button
            onClick={() => handleBulkAction('reject')}
            className="text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl px-3 py-1.5 transition-colors"
          >
            Reject All
          </button>
          <button
            onClick={() => setSelectedPostIds(new Set())}
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
