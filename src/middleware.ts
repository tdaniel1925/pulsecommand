import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Protect dashboard routes — must be logged in
  if (path.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect onboarding routes — must be logged in
  if (path.startsWith('/onboarding') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authorization is keyed off app_metadata.role (server-controlled, not
  // user-editable). Keep this in sync with isAdminUser() in src/lib/auth/admin.ts.
  const isAdmin = user?.app_metadata?.role === 'admin' ||
                  user?.app_metadata?.role === 'super_admin'

  // Protect admin routes (pages and API) — must be admin
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    if (!user) {
      // API callers get JSON; page visitors get redirected to login.
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!isAdmin) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && (path === '/login' || path === '/forgot-password')) {
    return NextResponse.redirect(
      new URL(isAdmin ? '/admin' : '/dashboard', request.url)
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/login',
    '/forgot-password',
    '/onboarding/:path*',
  ],
}
