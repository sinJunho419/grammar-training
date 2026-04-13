'use client'

import { useEffect, useState, Suspense } from 'react'

function LoadingContent() {
    const [status, setStatus] = useState('로그인 처리 중')
    const [showUI, setShowUI] = useState(false)

    useEffect(() => {
        const payload = localStorage.getItem('auth_payload')
        localStorage.removeItem('auth_payload')

        if (!payload) {
            alert('잘못된 접근입니다.')
            window.close()
            setStatus('잘못된 접근입니다. 이 창을 닫아주세요.')
            return
        }

        setShowUI(true)

        async function verify() {
            try {
                const res = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payload }),
                    credentials: 'same-origin',
                })

                const text = await res.text()
                let data
                try {
                    data = JSON.parse(text)
                } catch {
                    setStatus('응답 파싱 실패')
                    return
                }

                if (data.ok && data.redirectUrl) {
                    if (data.loginInfo) {
                        const cookieValue = encodeURIComponent(JSON.stringify(data.loginInfo))
                        document.cookie = `ipsinavi_grammar=${cookieValue}; path=/; max-age=86400; secure; samesite=lax`
                    }
                    setStatus('로그인 완료!')
                    window.location.replace(data.redirectUrl)
                } else {
                    setStatus(data.message || '인증에 실패했습니다.')
                }
            } catch {
                setStatus('네트워크 오류가 발생했습니다.')
            }
        }

        verify()
    }, [])

    if (!showUI) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <h2 className="text-slate-600 text-sm">{status}</h2>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <div className="text-xl font-bold text-slate-900 mb-6">9대 로직 영문법</div>
                <div className="flex justify-center mb-5">
                    <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
                <div className="text-sm text-slate-400">{status}<span className="dots" /></div>
            </div>
            <style jsx>{`
                .dots::after {
                    content: '';
                    animation: dots 1.5s steps(4, end) infinite;
                }
                @keyframes dots {
                    0%   { content: ''; }
                    25%  { content: '.'; }
                    50%  { content: '..'; }
                    75%  { content: '...'; }
                }
            `}</style>
        </div>
    )
}

export default function AuthLoadingPage() {
    return (
        <Suspense>
            <LoadingContent />
        </Suspense>
    )
}
