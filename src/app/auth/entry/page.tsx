'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function EntryForm() {
    const params = useSearchParams()
    const submitted = useRef(false)
    const [status, setStatus] = useState('인증 확인 중...')

    useEffect(() => {
        if (submitted.current) return
        submitted.current = true

        const payload = params.get('p')
        if (!payload) {
            setStatus('인증 정보가 없습니다.')
            return
        }

        window.history.replaceState({}, '', '/auth/entry')
        setStatus('서버 인증 요청 중...')

        fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload }),
            credentials: 'same-origin',
        })
            .then(async res => {
                const text = await res.text()
                let data
                try {
                    data = JSON.parse(text)
                } catch {
                    setStatus(`응답 파싱 실패: ${text.substring(0, 200)}`)
                    return
                }
                if (data.ok && data.redirectUrl) {
                    if (data.loginInfo) {
                        const cookieValue = encodeURIComponent(JSON.stringify(data.loginInfo))
                        document.cookie = `ipsinavi_grammar=${cookieValue}; path=/; max-age=86400; secure; samesite=lax`
                    }
                    const userName = data.loginInfo?.UserName || ''
                    setStatus(`${userName}님, 환영합니다!`)
                    window.location.replace(data.redirectUrl)
                } else {
                    setStatus(data.message || '인증에 실패했습니다.')
                }
            })
            .catch((err) => {
                setStatus(`네트워크 오류: ${err.message}`)
            })
    }, [params])

    return (
        <div style={{
            margin: 0, minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#0f172a,#1e293b,#0f172a)',
            fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
            color: '#fff',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: '3rem', fontWeight: 800,
                    background: 'linear-gradient(135deg,#3b82f6,#a855f7,#ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>9대 로직 영문법</div>
                <div style={{ marginTop: '1.5rem', fontSize: '1.2rem', color: '#94a3b8' }}>
                    {status}
                </div>
            </div>
        </div>
    )
}

export default function AuthEntryPage() {
    return (
        <Suspense>
            <EntryForm />
        </Suspense>
    )
}
