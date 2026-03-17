import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { nid, secret } = body

    if (!nid || !secret) {
        return NextResponse.json({ error: 'Missing nid or secret' }, { status: 400 })
    }

    const expectedSecret = process.env.IPSI_NAVI_LOGOUT_SECRET
    if (!expectedSecret || secret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const email = `grammar_${nid}@inputnavi.internal`
    const { data: users } = await adminClient.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)

    if (!user) {
        return NextResponse.json({ ok: true, message: 'User not found, nothing to do' })
    }

    await adminClient.auth.admin.signOut(user.id, 'global')

    return NextResponse.json({ ok: true })
}
