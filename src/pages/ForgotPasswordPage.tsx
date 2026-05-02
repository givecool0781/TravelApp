import { useState } from 'react'
import { Link } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL ?? ''

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStep('reset')
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) { setError('密碼至少 8 個字元'); return }
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail ?? '重設失敗'); return }
      setStep('done')
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">✈️</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">重設密碼</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <p className="text-sm text-slate-500">輸入帳號 Email，我們將寄送 6 位數驗證碼。</p>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {loading ? '寄送中...' : '寄送驗證碼'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-slate-500">驗證碼已寄到 <strong>{email}</strong>，請查收。</p>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">6 位數驗證碼</label>
                <input
                  type="text" value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="123456" maxLength={6} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center font-mono text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">新密碼</label>
                <input
                  type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少 8 個字元" required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {loading ? '重設中...' : '確認重設'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="font-semibold text-slate-900">密碼重設成功！</p>
              <Link to="/login" className="block w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold text-center hover:bg-blue-700">
                返回登入
              </Link>
            </div>
          )}

          {step !== 'done' && (
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-slate-400 hover:text-slate-600">返回登入</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
