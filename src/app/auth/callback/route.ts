import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Si hay error, redirigir a página de error
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data.user) {
      // Verificación exitosa
      console.log('User verified successfully:', data.user.email)

      // Si el email acaba de ser confirmado, redirigir a página de éxito
      if (data.user.email_confirmed_at) {
        return NextResponse.redirect(`${origin}/auth/verification-success`)
      }

      // Si ya estaba confirmado, ir al dashboard
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('Exchange code error:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_failed`)
    }
  }

  // Sin código, redirigir a error
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
}
