import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
  const { pathname } = request.nextUrl

  // console.log('PROXY user:', user, 'pathname:', pathname)

  const publicRoutes = ['/', '/catalogue', '/contact', '/login']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    return Response.redirect(loginUrl, 307)
  }

  if (user && pathname === '/login') {
    const dashboardUrl = new URL('/dashboard', request.url)
    return Response.redirect(dashboardUrl, 307)
  }

  const adminRoutes = ['/settings/users']
  const isAdminRoute = adminRoutes.some(r => pathname.startsWith(r))

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return Response.redirect(new URL('/dashboard', request.url), 307)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}