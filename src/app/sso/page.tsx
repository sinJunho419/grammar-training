'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function SsoRedirector() {
    const params = useSearchParams()

    useEffect(() => {
        const nid = params.get('nid')
        const token = params.get('token')
        const sname = params.get('sname')
        const userId = params.get('user_id')

        if (!nid || !token) return

        const timer = setTimeout(() => {
            const url = new URL('/api/auth/sso', window.location.origin)
            url.searchParams.set('nid', nid)
            url.searchParams.set('token', token)
            if (sname) url.searchParams.set('sname', sname)
            if (userId) url.searchParams.set('user_id', userId)
            window.location.href = url.toString()
        }, 1200)

        return () => clearTimeout(timer)
    }, [params])

    return null
}

export default function SsoPage() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b,#0f172a)',
            fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
            color: '#fff',
        }}>
            <Suspense>
                <SsoRedirector />
            </Suspense>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
                <h1 style={{
                    fontSize: '1.5rem', fontWeight: 800,
                    background: 'linear-gradient(135deg,#3b82f6,#a855f7,#ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>입시내비 인증 중</h1>
                <p style={{ marginTop: '0.5rem', color: '#94a3b8' }}>잠시만 기다려 주세요</p>
            </div>
        </div>
    )
}
