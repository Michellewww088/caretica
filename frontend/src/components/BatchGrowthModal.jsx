import { useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { aiService } from '../services/aiService'
import SkeletonCard from './SkeletonCard'

const today = () => new Date().toISOString().slice(0, 10)

function emptyRow() {
  return { date: today(), weight: '', height: '', head: '', sleep_hours: '', feeding_amount: '' }
}

const COLS = [
  { key: 'date',            label: 'Date',         type: 'date',   placeholder: '',         width: 'w-32' },
  { key: 'weight',          label: 'Weight (kg)',  type: 'number', placeholder: 'e.g. 7.5', width: 'w-24' },
  { key: 'height',          label: 'Height (cm)',  type: 'number', placeholder: '68.5',     width: 'w-24' },
  { key: 'head',            label: 'Head (cm)',    type: 'number', placeholder: '40.2',     width: 'w-24' },
  { key: 'sleep_hours',     label: 'Sleep (hrs)', type: 'number', placeholder: '14',        width: 'w-24' },
  { key: 'feeding_amount',  label: 'Feeding (ml)', type: 'number', placeholder: '120',      width: 'w-24' },
]

export default function BatchGrowthModal({ onClose, onAdded }) {
  const [rows, setRows]           = useState([emptyRow(), emptyRow(), emptyRow()])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryText, setSummaryText]       = useState(null)

  useEffect(() => {
    if (!result) return
    setSummaryLoading(true)
    aiService.getGrowthSummary()
      .then((data) => setSummaryText(data.summary))
      .catch(() => setSummaryText(null))
      .finally(() => setSummaryLoading(false))
  }, [result])

  const update = (i, key, val) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r))

  const addRow = () => setRows((prev) => [...prev, emptyRow()])

  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    setError('')
    // Filter out fully empty rows
    const valid = rows.filter((r) =>
      r.weight !== '' || r.height !== '' || r.head !== '' || r.sleep_hours !== '' || r.feeding_amount !== ''
    )
    if (valid.length === 0) {
      setError('Fill in at least one measurement')
      return
    }
    setLoading(true)
    try {
      const token = authService.getToken()
      const res = await fetch('/api/growth/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows: valid }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Batch save failed')
      setResult(data)
      onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div
        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Saved successfully!</h3>
          <p className="text-sm text-gray-500 mb-4">{result.inserted} measurement{result.inserted !== 1 ? 's' : ''} logged</p>
          {result.weight_percentile && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4 text-left">
              <p className="text-xs font-semibold text-gray-500 mb-1">WHO Percentile</p>
              <p className="text-sm text-gray-700">
                Weight: <span className="font-semibold text-blue-700">{result.weight_percentile.label}</span>
              </p>
              {result.height_percentile && (
                <p className="text-sm text-gray-700 mt-0.5">
                  Height: <span className="font-semibold text-blue-700">{result.height_percentile.label}</span>
                </p>
              )}
            </div>
          )}

          {/* AI Growth Summary */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl px-4 py-3 mb-4 text-left">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-2">✨ AI Growth Summary</p>
            {summaryLoading ? (
              <SkeletonCard lines={3} height={12} className="opacity-40" />
            ) : summaryText ? (
              <p className="text-sm text-white leading-relaxed">{summaryText}</p>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Batch Entry</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add multiple measurements at once — leave cells blank to skip</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th key={c.key} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-2">
                    {c.label}
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="space-y-1">
              {rows.map((row, i) => (
                <tr key={i}>
                  {COLS.map((col) => (
                    <td key={col.key} className="pr-2 pb-2">
                      <input
                        type={col.type}
                        value={row[col.key]}
                        placeholder={col.placeholder}
                        step={col.type === 'number' ? '0.01' : undefined}
                        min={col.type === 'number' ? '0' : undefined}
                        max={col.key === 'date' ? today() : undefined}
                        onChange={(e) => update(i, col.key, e.target.value)}
                        className={`${col.width} border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full`}
                      />
                    </td>
                  ))}
                  <td className="pb-2">
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                        title="Remove row"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addRow}
            className="mt-2 text-sm text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            + Add row
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving…' : `Save All Rows`}
          </button>
        </div>
      </div>
    </div>
  )
}
