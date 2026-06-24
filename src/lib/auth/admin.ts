import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

const ADMIN_ROLES = ['admin', 'super_admin']

/**
 * Authorization is keyed off `app_metadata.role`, which is server-controlled and
 * cannot be edited by the user (unlike `user_metadata`). Set it with the service
 * role: `auth.admin.updateUserById(id, { app_metadata: { role: 'admin' } })`.
 */
export function isAdminUser(user: User | null | undefined): boolean {
  const role = user?.app_metadata?.role
  return typeof role === 'string' && ADMIN_ROLES.includes(role)
}

/**
 * Guard for `/api/admin/*` route handlers. Returns `{ user }` on success, or
 * `{ response }` holding a 401/403 to return immediately. Usage:
 *
 *   const gate = await requireAdmin()
 *   if (gate.response) return gate.response
 *   // ...gate.user is an authenticated admin
 */
export async function requireAdmin(): Promise<
  { user: User; response: null } | { user: null; response: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!isAdminUser(user)) {
    return { user: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, response: null }
}
