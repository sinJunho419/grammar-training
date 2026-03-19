import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const FIVE_MINUTES = 5 * 60

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

function xorDecrypt(encrypted: Buffer, key: string): string {
    const keyBytes = Buffer.from(key, 'utf8')
    const result = Buffer.alloc(encrypted.length)
    for (let i = 0; i < encrypted.length; i++) {
        result[i] = encrypted[i] ^ keyBytes[i % keyBytes.length]
    }
    return result.toString('utf8')
}


export async function POST(request: NextRequest) {
    const IPSI_NAVI_URL = process.env.IPSI_NAVI_URL || 'https://ipsinavi.com'
    const t0 = Date.now()
    const contentType = request.headers.get('content-type') || ''
    const isJsonRequest = contentType.includes('application/json')

    try {
        let payload: string | null = null

        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData()
            payload = formData.get('payload') as string
        } else {
            const body = await request.json()
            payload = body.payload
        }

        if (!payload) {
            return sendError('[E1] payload 없음', IPSI_NAVI_URL, isJsonRequest)
        }

        const secretKey = process.env.GRAMMAR_SECRET_KEY?.trim()
        if (!secretKey) {
            return sendError('[E2] 서버 키 미설정', IPSI_NAVI_URL, isJsonRequest)
        }

        const encrypted = Buffer.from(payload, 'base64')
        let decrypted: string
        try {
            decrypted = xorDecrypt(encrypted, secretKey)
        } catch {
            return sendError('[E3] 복호화 실패', IPSI_NAVI_URL, isJsonRequest)
        }

        const parts = decrypted.split('|')
        if (parts.length < 3) {
            return sendError(`[E4] 형식 오류 (parts=${parts.length})`, IPSI_NAVI_URL, isJsonRequest)
        }

        const nid = parts[0]
        const name = parts[1]
        const ts = parseInt(parts[2], 10)

        if (!nid || !name || isNaN(ts)) {
            return sendError(`[E5] 값 누락 (nid=${nid}, name=${name}, ts=${ts})`, IPSI_NAVI_URL, isJsonRequest)
        }

        const now = Math.floor(Date.now() / 1000)
        if (Math.abs(now - ts) > FIVE_MINUTES) {
            return sendError('인증 시간이 만료되었습니다.', IPSI_NAVI_URL, isJsonRequest)
        }

        const email = `grammar_${nid}@inputnavi.internal`
        const displayName = name || `학생_${nid}`

        const admin = getAdminClient()
        const nidNum = parseInt(nid, 10)

        console.log(`[auth:grammar] ${nid} 시작 +${Date.now() - t0}ms`)

        // 입시내비 API + DB 조회 + generateLink 3개 병렬
        const [ipsiResult, dbResult, linkResult] = await Promise.all([
            fetch('https://m.ipsinavi.com/ipsivoca_Api.asp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `payload=${encodeURIComponent(payload)}`,
            }).then(r => r.json()).catch(() => null),
            admin
                .from('ipsinavi_Login_grammar')
                .select('idx, name, NsiteID, Scomment, status')
                .eq('nid', nidNum)
                .single(),
            admin.auth.admin.generateLink({
                type: 'magiclink',
                email,
            }),
        ])

        let ipsiStatus = 'active'
        let ipsiNsiteID: number | null = null
        let ipsiScomment: string | null = null
        if (ipsiResult) {
            ipsiStatus = ipsiResult.status || 'active'
            ipsiNsiteID = ipsiResult.NsiteID ? Number(ipsiResult.NsiteID) : null
            ipsiScomment = ipsiResult.Scomment || null
        }

        const existingLogin = dbResult.data

        if (ipsiStatus !== 'active') {
            if (existingLogin) {
                admin
                    .from('ipsinavi_Login_grammar')
                    .update({ status: '1' })
                    .eq('nid', nidNum)
                    .then(() => {})
            }
            return sendError('탈퇴한 회원입니다. 입시내비에 문의하세요.', IPSI_NAVI_URL, isJsonRequest)
        }

        // DB 업데이트와 세션 생성을 병렬로 처리
        let loginIdx!: number
        const dbUpdatePromise = (async () => {
            if (!existingLogin) {
                const { data: inserted } = await admin.from('ipsinavi_Login_grammar').insert({
                    nid: nidNum,
                    name: displayName,
                    NsiteID: ipsiNsiteID,
                    Scomment: ipsiScomment,
                    status: '0',
                }).select('idx').single()
                loginIdx = inserted!.idx
                console.log(`[auth:grammar] ${nid} INSERT (idx=${loginIdx}) +${Date.now() - t0}ms`)
            } else {
                loginIdx = existingLogin.idx
                const updates: Record<string, unknown> = { status: '0' }
                if (existingLogin.name !== displayName) updates.name = displayName
                if (ipsiNsiteID !== null && existingLogin.NsiteID !== ipsiNsiteID) updates.NsiteID = ipsiNsiteID
                if (ipsiScomment !== null && existingLogin.Scomment !== ipsiScomment) updates.Scomment = ipsiScomment
                admin
                    .from('ipsinavi_Login_grammar')
                    .update(updates)
                    .eq('nid', nidNum)
                    .then(() => {
                        console.log(`[auth:grammar] ${nid} UPDATE (idx=${loginIdx}) +${Date.now() - t0}ms`)
                    })
            }
        })()

        // generateLink 결과 처리 (이미 병렬로 실행됨)
        let linkData = linkResult.data

        if (!linkData?.properties?.hashed_token) {
            await admin.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: { nid, sname: displayName, source: 'grammar' },
            })
            const retry = await admin.auth.admin.generateLink({
                type: 'magiclink',
                email,
            })
            linkData = retry.data
        }

        if (!linkData?.properties?.hashed_token) {
            return sendError('세션 생성에 실패했습니다.', IPSI_NAVI_URL, isJsonRequest)
        }

        const supabaseUserId = linkData.user.id
        const cookieStore = await cookies()
        const serverClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setAll(cookiesToSet: any[]) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        cookiesToSet.forEach(({ name, value, options }: any) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        )

        const otpResult = await serverClient.auth.verifyOtp({
            token_hash: linkData.properties.hashed_token,
            type: 'email',
        })

        if (otpResult.error) {
            console.error('verifyOtp error:', otpResult.error.message)
            return sendError('세션 설정에 실패했습니다.', IPSI_NAVI_URL, isJsonRequest)
        }

        // DB 업데이트 완료 대기 (loginIdx 필요)
        await dbUpdatePromise

        // fire-and-forget: user_metadata 저장
        admin.auth.admin.updateUserById(supabaseUserId, {
            user_metadata: { nid, sname: displayName, source: 'grammar', login_idx: loginIdx },
        }).catch(() => {})

        const loginInfo = {
            login_idx: loginIdx,
            nid: nidNum,
            UserName: displayName,
            NsiteID: ipsiNsiteID,
            Scomment: ipsiScomment,
        }

        console.log(`[auth:grammar] ${nid} 완료 +${Date.now() - t0}ms`)

        const redirectUrl = `/`

        if (isJsonRequest) {
            return NextResponse.json({ ok: true, redirectUrl, loginInfo })
        }

        return htmlResponse(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><title>9대 로직 영문법</title></head>
<body>
<script>window.location.replace("${redirectUrl}");</script>
</body>
</html>`)

    } catch (err) {
        console.error('Verify error:', err)
        const errMsg = err instanceof Error ? err.message : String(err)
        return sendError(`비정상 접근입니다. (${errMsg})`, IPSI_NAVI_URL, isJsonRequest)
    }
}

function htmlResponse(html: string) {
    return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}

function sendError(message: string, redirectUrl: string, isJson: boolean) {
    if (isJson) {
        return NextResponse.json({ ok: false, message }, { status: 401 })
    }
    return htmlResponse(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><title>9대 로직 영문법</title></head>
<body>
<script>
  alert("${message}");
  window.location.href = "${redirectUrl}";
</script>
</body>
</html>`)
}
