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

function errorRedirect(message: string, baseUrl: string) {
    const url = new URL(baseUrl)
    url.searchParams.set('error', message)
    return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
    const IPSI_NAVI_URL = process.env.IPSI_NAVI_URL || 'https://ipsinavi.com'
    const origin = request.nextUrl.origin
    const t0 = Date.now()

    try {
        const payload = request.nextUrl.searchParams.get('p')
        if (!payload) {
            return errorRedirect('인증 정보가 없습니다.', IPSI_NAVI_URL)
        }

        const secretKey = process.env.GRAMMAR_SECRET_KEY?.trim()
        if (!secretKey) {
            return errorRedirect('서버 키 미설정', IPSI_NAVI_URL)
        }

        const encrypted = Buffer.from(payload, 'base64')
        let decrypted: string
        try {
            decrypted = xorDecrypt(encrypted, secretKey)
        } catch {
            return errorRedirect('복호화 실패', IPSI_NAVI_URL)
        }

        const parts = decrypted.split('|')
        if (parts.length < 3) {
            return errorRedirect('형식 오류', IPSI_NAVI_URL)
        }

        const nid = parts[0]
        const name = parts[1]
        const ts = parseInt(parts[2], 10)

        if (!nid || !name || isNaN(ts)) {
            return errorRedirect('값 누락', IPSI_NAVI_URL)
        }

        const now = Math.floor(Date.now() / 1000)
        if (Math.abs(now - ts) > FIVE_MINUTES) {
            return errorRedirect('인증 시간이 만료되었습니다.', IPSI_NAVI_URL)
        }

        const email = `grammar_${nid}@inputnavi.internal`
        const displayName = name || `학생_${nid}`
        const nidNum = parseInt(nid, 10)

        console.log(`[auth:grammar] ${nid} 시작 +${Date.now() - t0}ms`)

        // 입시내비 API + DB 조회 병렬
        const [ipsiResult, dbResult] = await Promise.all([
            fetch('https://m.ipsinavi.com/ipsivoca_Api.asp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `payload=${encodeURIComponent(payload)}`,
            }).then(r => r.json()).catch(() => null),
            getAdminClient()
                .from('ipsinavi_Login_grammar')
                .select('idx, name, NsiteID, Scomment, status')
                .eq('nid', nidNum)
                .single(),
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
                await getAdminClient()
                    .from('ipsinavi_Login_grammar')
                    .update({ status: '1' })
                    .eq('nid', nidNum)
            }
            return errorRedirect('탈퇴한 회원입니다. 입시내비에 문의하세요.', IPSI_NAVI_URL)
        }

        let loginIdx: number

        if (!existingLogin) {
            const { data: inserted } = await getAdminClient().from('ipsinavi_Login_grammar').insert({
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
            await getAdminClient()
                .from('ipsinavi_Login_grammar')
                .update(updates)
                .eq('nid', nidNum)
            console.log(`[auth:grammar] ${nid} UPDATE (idx=${loginIdx}) +${Date.now() - t0}ms`)
        }

        // Supabase 세션 생성
        let linkData = (await getAdminClient().auth.admin.generateLink({
            type: 'magiclink',
            email,
        })).data

        if (!linkData?.properties?.hashed_token) {
            await getAdminClient().auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: { nid, sname: displayName, source: 'grammar' },
            })
            const retry = await getAdminClient().auth.admin.generateLink({
                type: 'magiclink',
                email,
            })
            linkData = retry.data
        }

        if (!linkData?.properties?.hashed_token) {
            return errorRedirect('세션 생성에 실패했습니다.', IPSI_NAVI_URL)
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
            return errorRedirect('세션 설정에 실패했습니다.', IPSI_NAVI_URL)
        }

        // fire-and-forget: user_metadata 저장
        getAdminClient().auth.admin.updateUserById(supabaseUserId, {
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

        // 쿠키 설정 후 메인 페이지로 리다이렉트
        const redirectUrl = new URL(`/?welcome=${encodeURIComponent(displayName)}`, origin)
        const response = NextResponse.redirect(redirectUrl)
        response.cookies.set('ipsinavi_grammar', JSON.stringify(loginInfo), {
            path: '/',
            maxAge: 86400,
            secure: true,
            sameSite: 'lax',
        })

        return response

    } catch (err) {
        console.error('Entry auth error:', err)
        return errorRedirect('비정상 접근입니다.', IPSI_NAVI_URL)
    }
}
