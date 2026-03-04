import { useState } from 'react'
import Layout from '../components/Layout'
import { authService } from '../services/authService'

const RISK_COLOR = {
  HIGH:     'bg-red-50 border-red-300 text-red-700',
  MODERATE: 'bg-amber-50 border-amber-300 text-amber-700',
  NORMAL:   'bg-green-50 border-green-300 text-green-700',
}

const RISK_ICON = { HIGH: '🔴', MODERATE: '🟡', NORMAL: '🟢' }

export default function Report() {
  const [report,    setReport]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate report')
      setReport(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <Layout title="Growth Report">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-1">AI Growth Risk Report</h2>
              <p className="text-sm text-gray-400">
                Generates a structured pediatric growth assessment with WHO percentiles and risk flags.
              </p>
            </div>
            <button
              onClick={generate}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0 ml-4"
            >
              {loading ? 'Generating…' : '✨ Generate Report'}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
          )}
        </div>

        {report && (
          <>
            {/* Overall risk banner */}
            <div className={`rounded-2xl border p-4 mb-4 flex items-center gap-3 ${RISK_COLOR[report.overall_risk]}`}>
              <span className="text-2xl">{RISK_ICON[report.overall_risk]}</span>
              <div>
                <p className="text-sm font-semibold">
                  Overall Risk: {report.overall_risk}
                </p>
                <p className="text-xs opacity-80">
                  Generated {new Date(report.generated_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Risk flags */}
            {report.risk_flags.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">⚠️ Risk Flags</p>
                <div className="space-y-2">
                  {report.risk_flags.map((flag, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border text-sm ${RISK_COLOR[flag.level]}`}>
                      <span>{RISK_ICON[flag.level]}</span>
                      <div>
                        <span className="font-semibold">{flag.metric}:</span> {flag.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Measurements */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">📊 Measurements</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: '⚖️ Weight', data: report.measurements.weight, unit: 'kg' },
                  { label: '📏 Height', data: report.measurements.height, unit: 'cm' },
                  { label: '🔵 Head',   data: report.measurements.head,   unit: 'cm' },
                  { label: '😴 Sleep',  data: report.measurements.sleep,  unit: 'hrs' },
                  { label: '🍼 Feeding',data: report.measurements.feeding, unit: 'ml' },
                ].filter(m => m.data).map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                    <p className="text-base font-bold text-gray-800">{m.data.value} {m.unit}</p>
                    {m.data.label && <p className="text-xs text-gray-500 mt-0.5">{m.data.label}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Full report text */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 mb-4 text-white">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-3">📋 Full Report</p>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">{report.report}</pre>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 text-center px-4">
              This report is for informational purposes only. Always consult a licensed pediatrician for medical advice.
            </p>
          </>
        )}

        {!report && !loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">No report generated yet</h3>
            <p className="text-sm text-gray-400">Click "Generate Report" to get a full AI growth risk assessment.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
