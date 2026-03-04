import { useState } from 'react'
import Layout from '../components/Layout'
import { authService } from '../services/authService'
import { getStage, getCorrectedAgeMonths } from '../config/babyStages'

const RISK_COLOR = {
  HIGH:     'bg-red-50 border-red-300 text-red-700',
  MODERATE: 'bg-amber-50 border-amber-300 text-amber-700',
  NORMAL:   'bg-green-50 border-green-300 text-green-700',
}
const RISK_ICON = { HIGH: '🔴', MODERATE: '🟡', NORMAL: '🟢' }
const RISK_BG   = { HIGH: 'from-red-500 to-red-600', MODERATE: 'from-amber-500 to-amber-600', NORMAL: 'from-green-500 to-green-600' }

function formatAge(months) {
  if (!months && months !== 0) return '—'
  if (months < 1)  return 'Newborn'
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} old`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m > 0 ? `${y}y ${m}mo old` : `${y} year${y !== 1 ? 's' : ''} old`
}

function PctBar({ pct }) {
  if (pct == null) return null
  const pos = Math.max(2, Math.min(98, pct))
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>3rd</span><span>50th</span><span>97th</span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full">
        <div className="absolute h-2 bg-blue-100 rounded-full w-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow"
          style={{ left: `calc(${pos}% - 6px)` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1 text-center">WHO percentile</p>
    </div>
  )
}

export default function Report() {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showWarnings, setShowWarnings] = useState(false)

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/report/generate', {
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

  // Derive stage from report baby data
  const stage = report?.baby
    ? (() => {
        const age = getCorrectedAgeMonths(
          report.baby.age_months,
          report.baby.baby_type,
          report.baby.weeks_premature || 0
        )
        return getStage(age)
      })()
    : null

  const weightPct = report?.measurements?.weight?.percentile
  const heightPct = report?.measurements?.height?.percentile

  return (
    <Layout title="Growth Report">
      <div className="max-w-2xl mx-auto">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-1">Premium Growth Report</h2>
              <p className="text-sm text-gray-400">
                AI-powered pediatric assessment with WHO percentiles and risk analysis.
              </p>
            </div>
            <button
              onClick={generate}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? 'Generating…' : report ? '↻ Regenerate' : '✨ Generate Report'}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
          )}
        </div>

        {/* Empty state */}
        {!report && !loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">No report generated yet</h3>
            <p className="text-sm text-gray-400">Generate a report to get a full AI growth risk assessment.</p>
          </div>
        )}

        {report && (
          <>
            {/* ── SECTION 1: Overall risk banner ── */}
            <div className={`bg-gradient-to-r ${RISK_BG[report.overall_risk]} rounded-2xl p-5 mb-5 text-white`}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{RISK_ICON[report.overall_risk]}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Overall Risk</p>
                  <p className="text-lg font-bold">{report.overall_risk}</p>
                </div>
              </div>
              <p className="text-xs opacity-70">
                Generated {new Date(report.generated_at).toLocaleString('en-PH')}
              </p>
            </div>

            {/* ── SECTION 2: Baby Info ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">👶 Baby Info</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Name',       value: report.baby.name },
                  { label: 'Age',        value: formatAge(report.baby.age_months) },
                  { label: 'Gender',     value: report.baby.gender || '—' },
                  { label: 'Blood Type', value: report.baby.blood_type || '—' },
                  { label: 'Stage',      value: stage?.label || '—' },
                  { label: 'Baby Type',  value: report.baby.baby_type || 'normal' },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 3: Growth Snapshot ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">📊 Growth Snapshot</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { label: '⚖️ Weight', data: report.measurements.weight, unit: 'kg' },
                  { label: '📏 Height', data: report.measurements.height, unit: 'cm' },
                  { label: '🔵 Head',   data: report.measurements.head,   unit: 'cm' },
                  { label: '😴 Sleep',  data: report.measurements.sleep,  unit: 'hrs' },
                  { label: '🍼 Feeding',data: report.measurements.feeding, unit: 'ml' },
                ].filter((m) => m.data).map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                    <p className="text-lg font-bold text-gray-800">{m.data.value} <span className="text-sm font-normal text-gray-500">{m.unit}</span></p>
                    {m.data.label && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        m.data.status === 'normal' ? 'bg-green-100 text-green-700' :
                        m.data.status === 'watch'  ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {m.data.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* WHO percentile bars */}
              {(weightPct != null || heightPct != null) && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  {weightPct != null && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Weight percentile</p>
                      <PctBar pct={weightPct} />
                    </div>
                  )}
                  {heightPct != null && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Height percentile</p>
                      <PctBar pct={heightPct} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 4: Risk Flags ── */}
            {report.risk_flags.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">⚠️ Risk Flags</p>
                <div className="space-y-2">
                  {report.risk_flags.map((flag, i) => (
                    <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${RISK_COLOR[flag.level]}`}>
                      <span className="mt-0.5">{RISK_ICON[flag.level]}</span>
                      <div>
                        <span className="font-semibold capitalize">{flag.metric}:</span> {flag.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SECTION 5: Stage Recommendations ── */}
            {stage && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{stage.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stage Recommendations</p>
                    <p className="text-sm font-bold text-gray-800">{stage.label}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Recommended This Stage</p>
                  <ul className="space-y-1.5">
                    {stage.tasks.map((task) => (
                      <li key={task} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-4 h-4 mt-0.5 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-[9px]">✓</span>
                        </span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Tips</p>
                  <ul className="space-y-1.5">
                    {stage.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="shrink-0">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setShowWarnings(!showWarnings)}
                  className="text-xs font-medium text-amber-600 flex items-center gap-1"
                >
                  ⚠ Warning signs to watch for
                  <span className="text-[10px]">{showWarnings ? '▲' : '▼'}</span>
                </button>
                {showWarnings && (
                  <ul className="mt-2 space-y-1.5 pl-1">
                    {stage.warnings.map((w) => (
                      <li key={w} className="text-xs text-amber-700 flex items-start gap-2">
                        <span className="shrink-0">•</span>{w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── SECTION 6: Advanced Analysis (AI) ── */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 mb-5 text-white">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">✨ Advanced Analysis</p>
              <p className="text-xs text-blue-300 mb-3">AI-generated by Claude · for educational purposes only</p>

              {/* Growth trends */}
              {(report.trends?.weight || report.trends?.height) && (
                <div className="flex gap-3 mb-4">
                  {report.trends.weight && (
                    <div className="flex-1 bg-white/10 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-blue-200 uppercase tracking-wide">Weight Trend</p>
                      <p className="text-sm font-semibold mt-0.5">
                        {report.trends.weight.direction === 'increasing' ? '↑ Increasing' :
                         report.trends.weight.direction === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
                        {report.trends.weight.percent_change != null && (
                          <span className="ml-1 text-blue-200 font-normal text-xs">
                            {report.trends.weight.percent_change > 0 ? '+' : ''}{report.trends.weight.percent_change.toFixed(1)}%
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {report.trends.height && (
                    <div className="flex-1 bg-white/10 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-blue-200 uppercase tracking-wide">Height Trend</p>
                      <p className="text-sm font-semibold mt-0.5">
                        {report.trends.height.direction === 'increasing' ? '↑ Increasing' :
                         report.trends.height.direction === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
                        {report.trends.height.percent_change != null && (
                          <span className="ml-1 text-blue-200 font-normal text-xs">
                            {report.trends.height.percent_change > 0 ? '+' : ''}{report.trends.height.percent_change.toFixed(1)}%
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm leading-relaxed">{report.report}</p>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 text-center px-4 mb-6">
              This report is for informational purposes only and does not replace professional medical advice. Always consult a licensed pediatrician.
            </p>
          </>
        )}
      </div>
    </Layout>
  )
}
