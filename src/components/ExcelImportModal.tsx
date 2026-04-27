import { useState, useRef } from 'react'
import { X, Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet, Loader } from 'lucide-react'
import type { Trip, TripEvent } from '../types'
import {
  parseExcelFile,
  distributeRowsToTrip,
  downloadTemplate,
  validateFile,
  type ParsedRow,
  type ImportError,
} from '../utils/excelUtils'

const categoryLabel: Record<string, string> = {
  food: '餐廳', attraction: '景點', transport: '交通', hotel: '住宿', other: '其他',
}
const categoryColor: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700',
  attraction: 'bg-green-100 text-green-700',
  transport: 'bg-blue-100 text-blue-700',
  hotel: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-600',
}

interface DistributedEvent {
  dayId: string
  dayDate: string
  event: TripEvent
}

interface Props {
  trip: Trip
  onImport: (events: { dayId: string; event: TripEvent }[]) => void
  onClose: () => void
}

export default function ExcelImportModal({ trip, onImport, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'preview' | 'done'>('idle')
  const [fileError, setFileError] = useState<string | null>(null)
  const [parseErrors, setParseErrors] = useState<ImportError[]>([])
  const [preview, setPreview] = useState<DistributedEvent[]>([])
  const [skipped, setSkipped] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')

  async function handleFile(file: File) {
    setFileError(null)
    setParseErrors([])
    setPreview([])
    setSkipped([])

    const err = validateFile(file)
    if (err) { setFileError(err); return }

    setFileName(file.name)
    setStatus('parsing')

    try {
      const { rows, errors } = await parseExcelFile(file)
      setParseErrors(errors)

      const distributed = distributeRowsToTrip(trip, rows)
      const dayDateMap = new Map(trip.days.map((d) => [d.id, d.date]))

      const enriched: DistributedEvent[] = distributed.map(({ dayId, event }) => ({
        dayId,
        dayDate: dayDateMap.get(dayId) ?? '',
        event,
      }))

      const distributedIds = new Set(distributed.map((r) => r.event.id))
      const skippedRows = rows.filter((r) => !distributedIds.has(r.event.id))

      setPreview(enriched)
      setSkipped(skippedRows)
      setStatus('preview')
    } catch {
      setFileError('解析失敗，請確認檔案格式正確')
      setStatus('idle')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleConfirmImport() {
    onImport(preview.map(({ dayId, event }) => ({ dayId, event })))
    setStatus('done')
    setTimeout(onClose, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-green-600" />
            <h2 className="text-lg font-bold text-slate-900">匯入 Excel 行程</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Step 1: Download template */}
          <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">下載模板，填入行程資料</p>
              <p className="text-xs text-slate-500 mt-0.5">模板已預填旅行日期，按照格式填好後儲存</p>
              <button
                onClick={() => downloadTemplate(trip)}
                className="mt-2.5 flex items-center gap-2 bg-white border border-blue-300 text-blue-700 px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
              >
                <Download size={14} />
                下載「{trip.name}」模板
              </button>
            </div>
          </div>

          {/* Step 2: Upload */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-7 h-7 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">上傳填好的 Excel 檔案</p>

              {/* Drop zone */}
              <div
                className="mt-2.5 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                {status === 'parsing' ? (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Loader size={24} className="animate-spin text-blue-500" />
                    <p className="text-sm">解析中...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Upload size={24} />
                    <p className="text-sm font-medium text-slate-600">
                      {fileName || '點擊或拖曳 .xlsx / .xls 檔案'}
                    </p>
                    <p className="text-xs">檔案大小上限 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleInputChange}
              />

              {fileError && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={14} />
                  {fileError}
                </div>
              )}
            </div>
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                <AlertCircle size={15} />
                以下列有問題已略過（{parseErrors.length} 筆）
              </p>
              <ul className="space-y-1">
                {parseErrors.map((e, i) => (
                  <li key={i} className="text-xs text-amber-700">
                    第 {e.row} 列：{e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skipped (date not in trip) */}
          {skipped.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
              <p className="text-xs font-medium text-amber-800">
                {skipped.length} 筆資料的日期不在旅行範圍內，已略過
              </p>
              {(() => {
                const excelDates = [...new Set(skipped.map((r) => r.date))].sort()
                return (
                  <p className="text-xs text-amber-700">
                    Excel 日期：{excelDates[0]} ～ {excelDates[excelDates.length - 1]}
                    　旅行日期：{trip.startDate} ～ {trip.endDate}
                  </p>
                )
              })()}
              <p className="text-xs text-amber-600">請確認建立旅行時的日期範圍是否正確</p>
            </div>
          )}

          {/* Preview */}
          {status === 'preview' && preview.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">
                預覽：共 {preview.length} 筆可匯入
              </p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {preview.map(({ dayDate, event }) => (
                  <div key={event.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                    <span className="text-xs text-slate-400 font-mono w-10 flex-shrink-0">{event.time}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${categoryColor[event.category]}`}>
                      {categoryLabel[event.category]}
                    </span>
                    <span className="text-sm font-medium text-slate-800 flex-1 truncate">{event.title}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{dayDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'preview' && preview.length === 0 && (
            <div className="text-center py-6 text-slate-400">
              <p className="text-sm">沒有可匯入的行程</p>
              <p className="text-xs mt-1">請確認日期是否在旅行範圍內（{trip.startDate} ～ {trip.endDate}）</p>
            </div>
          )}

          {status === 'done' && (
            <div className="flex items-center justify-center gap-2 py-4 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">匯入成功！</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === 'preview' && preview.length > 0 && (
          <div className="px-5 pb-6 flex gap-3">
            <button
              onClick={() => { setStatus('idle'); setPreview([]); setFileName('') }}
              className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
            >
              重新上傳
            </button>
            <button
              onClick={handleConfirmImport}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition"
            >
              確認匯入 {preview.length} 筆行程
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
