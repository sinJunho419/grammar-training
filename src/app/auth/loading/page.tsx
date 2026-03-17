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
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b,#0f172a)',
                color: '#fff', fontFamily: 'sans-serif',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>{status}</h2>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-orb orb1" />
            <div className="bg-orb orb2" />
            <div className="container">
                <div className="logo">9대 로직 영문법</div>
                <div className="spinner-wrap"><div className="spinner" /></div>
                <div className="status">{status}<span className="dots" /></div>
            </div>
            <style jsx>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                .container {
                    text-align: center;
                    z-index: 1;
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .logo {
                    font-size: 2.2rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #3b82f6, #a855f7, #ec4899);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 2rem;
                }
                .spinner-wrap {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                }
                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid rgba(59, 130, 246, 0.2);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .status {
                    font-size: 0.95rem;
                    color: #94a3b8;
                }
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
                .bg-orb {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                    animation: float 6s ease-in-out infinite;
                }
                .orb1 {
                    width: 300px; height: 300px;
                    background: #3b82f6;
                    top: -100px; left: -100px;
                }
                .orb2 {
                    width: 250px; height: 250px;
                    background: #a855f7;
                    bottom: -80px; right: -80px;
                    animation-delay: 3s;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(20px); }
                }
            `}</style>
        </>
    )
}

export default function AuthLoadingPage() {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b,#0f172a)',
            fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
        }}>
            <Suspense>
                <LoadingContent />
            </Suspense>
        </div>
    )
}
