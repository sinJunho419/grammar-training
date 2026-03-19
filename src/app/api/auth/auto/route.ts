import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const FIVE_MINUTES = 5 * 60

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const nid = searchParams.get('nid')
    const ts = searchParams.get('ts')
    const sig = searchParams.get('sig')
    const sname = searchParams.get('sname') || null
    const userId = searchParams.get('user_id') || null
    const redirect = searchParams.get('redirect') || '/'

    if (!nid || !ts || !sig) {
        return new NextResponse('Missing required parameters: nid, ts, sig', { status: 400 })
    }

    const secret = process.env.AUTH_HMAC_SECRET?.trim()
    if (!secret) {
        console.error('AUTH_HMAC_SECRET is not set')
        return new NextResponse('Server configuration error', { status: 500 })
    }

    const message = `${nid}:${ts}`
    const expected = crypto.createHmac('sha256', secret).update(message).digest('hex')

    let valid = false
    try {
        if (expected.length === sig.length) {
            valid = crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8'))
        }
    } catch { /* length mismatch */ }

    if (!valid) {
        console.error('Auto-auth HMAC verification failed for nid:', nid)
        return new NextResponse('Invalid signature', { status: 401 })
    }

    const tsNum = parseInt(ts, 10)
    const now = Math.floor(Date.now() / 1000)
    if (isNaN(tsNum) || Math.abs(now - tsNum) > FIVE_MINUTES) {
        return new NextResponse('Token expired', { status: 401 })
    }

    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const email = `grammar_${nid}@inputnavi.internal`
    const displayName = sname || `학생_${nid}`

    // generateLink 먼저 시도 (기존 유저면 바로 성공 → fast path)
    let linkData = (await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
    })).data

    if (!linkData?.properties?.hashed_token) {
        // 유저가 없으면 생성 후 재시도
        const { error: createError } = await adminClient.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
                nid,
                sname: displayName,
                external_user_id: userId,
                source: 'grammar',
            },
        })

        if (createError && !createError.message.includes('already been registered')) {
            console.error('Auto-provisioning error:', createError.message)
            return new NextResponse('Failed to provision user', { status: 500 })
        }

        const retry = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email,
        })
        linkData = retry.data
    } else if (sname) {
        // 기존 유저의 metadata 업데이트 (fire-and-forget)
        adminClient.auth.admin.updateUserById(linkData.user.id, {
            user_metadata: { ...linkData.user.user_metadata, sname, external_user_id: userId || linkData.user.user_metadata?.external_user_id },
        }).catch(() => {})
    }

    if (!linkData?.properties?.hashed_token) {
        console.error('generateLink failed after retry')
        return new NextResponse('Failed to create session', { status: 500 })
    }

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

    const { error: otpError } = await serverClient.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: 'email',
    })

    if (otpError) {
        console.error('verifyOtp error:', otpError.message)
        return new NextResponse('Failed to establish session', { status: 500 })
    }

    const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    return NextResponse.redirect(`${origin}${redirect}`)
}
