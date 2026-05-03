import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'

const CURRENCIES: { code: string; name: string; flag: string }[] = [
  { code: 'TWD', name: '台幣', flag: '🇹🇼' },
  { code: 'JPY', name: '日幣', flag: '🇯🇵' },
  { code: 'USD', name: '美元', flag: '🇺🇸' },
  { code: 'EUR', name: '歐元', flag: '🇪🇺' },
  { code: 'KRW', name: '韓元', flag: '🇰🇷' },
  { code: 'HKD', name: '港幣', flag: '🇭🇰' },
  { code: 'GBP', name: '英鎊', flag: '🇬🇧' },
  { code: 'CNY', name: '人民幣', flag: '🇨🇳' },
  { code: 'SGD', name: '新加坡元', flag: '🇸🇬' },
  { code: 'THB', name: '泰銖', flag: '🇹🇭' },
  { code: 'AUD', name: '澳幣', flag: '🇦🇺' },
]

function fmt(n: number, code: string) {
  const decimals = ['JPY', 'KRW', 'TWD', 'THB'].includes(code) ? 0 : 2
  return n.toLocaleString('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function ExchangePage() {
  const navigate = useNavigate()
  const [base, setBase] = useState('TWD')
  const [amount, setAmount] = useState('1000')
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [updated, setUpdated] = useState('')

  const fetchRates = useCallback(async () => {
    setLoading(true)
    try {
      const targets = CURRENCIES.map(c => c.code).filter(c => c !== base).join(',')
      const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${targets}`)
      const data = await res.json()
      setRates(data.rates ?? {})
      setUpdated(data.date ?? '')
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => { fetchRates() }, [fetchRates])

  const num = parseFloat(amount.replace(/,/g, '')) || 0
  const baseCurrency = CURRENCIES.find(c => c.code === base)!

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors">
            <ArrowLeft size={16} /> 返回
          </button>
          <h1 className="font-bold text-slate-900 flex-1">匯率換算</h1>
          <button onClick={fetchRates} disabled={loading} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <RefreshCw size={16} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Input */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-400 mb-3">輸入金額</p>
          <div className="flex gap-3">
            <select
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          {updated && (
            <p className="text-xs text-slate-400 mt-3">匯率更新：{updated}（ECB 官方資料）</p>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {CURRENCIES.filter(c => c.code !== base).map(c => {
            const rate = rates[c.code]
            const converted = rate ? num * rate : null
            return (
              <button
                key={c.code}
                onClick={() => { setBase(c.code); setAmount(converted ? fmt(converted, c.code).replace(/,/g, '') : '1') }}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{c.code}</p>
                    <p className="text-xs text-slate-400">{c.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  {converted != null ? (
                    <>
                      <p className="font-bold text-slate-900">{fmt(converted, c.code)}</p>
                      <p className="text-xs text-slate-400">
                        1 {baseCurrency.code} = {rate ? fmt(rate, c.code) : '—'} {c.code}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-300 text-sm">載入中...</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
