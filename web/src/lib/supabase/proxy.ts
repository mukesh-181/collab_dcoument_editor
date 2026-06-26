import { ENV } from '@/constants/env'
import { createServerClient } from '@supabase/ssr'
import { ROUTES } from '@/constants/routes'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    ENV.SUPABASE_URL,
    ENV.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Define routes that do not require authentication
  const isPublicRoute = 
    request.nextUrl.pathname === ROUTES.HOME ||
    request.nextUrl.pathname === ROUTES.LOGIN ||
    request.nextUrl.pathname === ROUTES.FORGOT_PASSWORD ||
    request.nextUrl.pathname.startsWith(ROUTES.AUTH_CALLBACK)

  if (!user && !isPublicRoute) {
    // no user, redirecting the user to the login page with a 'next' param
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.LOGIN
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname === ROUTES.LOGIN) {
    // user is logged in, redirect away from login page
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.DASHBOARD
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
