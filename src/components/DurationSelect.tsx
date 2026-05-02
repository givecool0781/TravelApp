const DURATIONS = [
  '15 分鐘', '30 分鐘', '45 分鐘',
  '1 小時', '1.5 小時', '2 小時', '2.5 小時', '3 小時',
  '4 小時', '5 小時', '6 小時', '半天', '一天',
]

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function DurationSelect({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {DURATIONS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(value === d ? '' : d)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
            value === d
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  )
}
