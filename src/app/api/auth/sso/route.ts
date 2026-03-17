import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const url = new URL('/api/auth/auto', origin)
    searchParams.forEach((value, key) => url.searchParams.set(key, value))

    return NextResponse.redirect(url.toString())
}
