import { type NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { updateSession } from "./lib/supabase/middleware"

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Supabase 세션 갱신
  const { supabaseResponse } = await updateSession(request)

  // 2. next-intl 로케일 라우팅
  const intlResponse = intlMiddleware(request)

  // 3. Supabase 쿠키를 intl 응답에 복사
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    })
  })

  return intlResponse
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
}
