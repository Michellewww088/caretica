import { useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { aiService } from '../services/aiService'
import SkeletonCard from './SkeletonCard'

const METRICS = [
  { key: 'weight',         label: 'Weight',   unit: 'kg',  placeholder: 'e.g. 7.5',  step: '0.01', min: 0, max: 50  },
  { key: 'height',         label: 'Height',   unit: 'cm',  placeholder: 'e.g. 68.5', step: '0.1',  min: 0, max: 200 },
  { key: 'head',           label: 'Head Circ', unit: 'cm', placeholder: 'e.g. 40.2', step: '0.1',  min: 0, max: 70  },
  { key: 'sleep_hours',    label: 'Sleep',    unit: 'hrs', placeholder: 'e.g. 14',   step: '0.5',  min: 0, max: 24  },
  { key: 'feeding_amount', label: 'Feeding',  unit: 'ml',  placeholder: 'e.g. 120',  step: '5',    min: 0, max: 500 },
]

const API_TYPE = { weight: 'weight', height: 'height', head: 'head', sleep_hours: 'sleep', feeding_amount: 'feeding' }
const API_UNIT = { weight: 'kg', height: 'cm', head: 'cm', sleep_hours: 'hrs', feeding_amount: 'ml' }

export default function AddGrowthModal({ onClose, onAdded, focusKey = '' }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate]   = useState(today)
  const [values, setValues] = useState({ weight: '', height: '', head: '', sleep_hours: '', feeding_amount: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [saved, setSaved]   = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryText, setSummaryText]       = useState(null)

  useEffect(() => {
    if (!saved) return
    setSummaryLoading(true)
    aiService.getGrowthSummary()
      .then((data) => setSummaryText(data.summary))
      .catch(() => setSummaryText(null))
      .finally(() => setSummaryLoading(false))
  }, [saved])

  const set = (key, val) => setValues((v) => ({ ...v, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const entries = METRICS.filter((m) => values[m.key] !== '')
    if (entries.length === 0) {
      setError('Enter at least one measurement')
      return
    }
    setLoading(true)
    try {
      const token = authService.getToken()
      for (const m of entries) {
        await fetch('/api/growth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            type:  API_TYPE[m.key],
            value: parseFloat(values[m.key]),
            unit:  API_UNIT[m.key],
            date,
          }),
        })
      }
      onAdded()
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (saved) {
    return (
      <div
        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Saved!</h3>
          <p className="text-sm text-gray-500 mb-4">Measurements logged successfully.</p>

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
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">Log Measurements</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Metrics */}
          <p className="text-xs text-gray-400 pt-1">Fill in any measurements taken today:</p>
          <div className="grid grid-cols-2 gap-2.5">
            {METRICS.map((m) => (
              <div key={m.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {m.label} <span className="text-gray-400 font-normal">({m.unit})</span>
                </label>
                <input
                  type="number"
                  step={m.step}
                  min={m.min}
                  max={m.max}
                  value={values[m.key]}
                  onChange={(e) => set(m.key, e.target.value)}
                  placeholder={m.placeholder}
                  autoFocus={focusKey === m.key}
                  className={`w-full border rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${focusKey === m.key ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
