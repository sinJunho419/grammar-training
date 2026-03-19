'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface DebugInfo {
    ipsiResult: unknown
    decrypted: string
    nid: string
    name: string
    ts: number
    loginInfo?: unknown
    error?: string
    rawResponse?: string
}

function EntryForm() {
    const params = useSearchParams()
    const submitted = useRef(false)
    const [status, setStatus] = useState('인증 확인 중...')
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)

    useEffect(() => {
        if (submitted.current) return
        submitted.current = true

        const payload = params.get('p')
        if (!payload) {
            setStatus('인증 정보가 없습니다.')
            return
        }

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
                    setStatus(`응답 파싱 실패`)
                    setDebugInfo({ rawResponse: text.substring(0, 500) } as DebugInfo)
                    return
                }

                // 디버그 정보 항상 표시
                if (data.debug) {
                    setDebugInfo({ ...data.debug, loginInfo: data.loginInfo })
                } else {
                    setDebugInfo({ error: data.message, rawResponse: JSON.stringify(data) } as DebugInfo)
                }

                if (data.ok && data.redirectUrl) {
                    if (data.loginInfo) {
                        const cookieValue = encodeURIComponent(JSON.stringify(data.loginInfo))
                        document.cookie = `ipsinavi_grammar=${cookieValue}; path=/; max-age=86400; secure; samesite=lax`
                    }
                    const userName = data.loginInfo?.UserName || ''
                    setStatus(`${userName}님, 인증 성공! (자동 이동 중단 - 디버그 모드)`)
                } else {
                    setStatus(data.message || '인증에 실패했습니다.')
                }
            })
            .catch((err) => {
                setStatus(`네트워크 오류: ${err.message}`)
                setDebugInfo({ error: err.message } as DebugInfo)
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
            <div style={{ textAlign: 'center', maxWidth: '800px', width: '100%', padding: '0 1rem' }}>
                <div style={{
                    fontSize: '3rem', fontWeight: 800,
                    background: 'linear-gradient(135deg,#3b82f6,#a855f7,#ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>9대 로직 영문법</div>
                <div style={{ marginTop: '1.5rem', fontSize: '1.2rem', color: '#94a3b8' }}>
                    {status}
                </div>

                {debugInfo && (
                    <div style={{
                        marginTop: '2rem', textAlign: 'left',
                        background: 'rgba(0,0,0,0.5)', borderRadius: '12px',
                        padding: '1.5rem', border: '1px solid #334155',
                    }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b', marginBottom: '1rem' }}>
                            DEBUG - 입시내비 API 리턴값
                        </div>
                        <pre style={{
                            fontSize: '0.85rem', color: '#e2e8f0',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                            margin: 0, lineHeight: 1.6,
                        }}>
{JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    </div>
                )}
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
