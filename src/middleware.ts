import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const loginCookie = request.cookies.get('ipsinavi_grammar')
    const hasSupabaseSession = request.cookies.getAll().some(c =>
        c.name.startsWith('sb-') && c.name.includes('auth-token')
    )

    if (!loginCookie?.value || !hasSupabaseSession) {
        return new NextResponse(
            `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><title>9대 로직 영문법</title></head>
<body>
<script>
  alert("잘못된 접근입니다.");
  window.close();
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#fff;font-family:sans-serif;"><div style="text-align:center;"><h2>잘못된 접근입니다.</h2><p style="color:#94a3b8;">이 창을 닫아주세요.</p></div></div>';
</script>
</body>
</html>`,
            {
                status: 403,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
        )
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/grade/:path*',
        '/wrong-answers/:path*',
    ],
}
