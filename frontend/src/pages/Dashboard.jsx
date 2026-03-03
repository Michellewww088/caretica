import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import GrowthChart from '../components/GrowthChart'
import AddGrowthModal from '../components/AddGrowthModal'
import BatchGrowthModal from '../components/BatchGrowthModal'
import TrialBanner from '../components/TrialBanner'
import SkeletonCard from '../components/SkeletonCard'
import { growthService } from '../services/growthService'
import { uploadService } from '../services/uploadService'
import { babyService } from '../services/babyService'
import { aiService } from '../services/aiService'
import { generateGrowthPDF } from '../services/pdfService'

function getAgeMonths(birthdate) {
  if (!birthdate) return 0
  const birth = new Date(birthdate)
  const now   = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
}

function formatAge(months) {
  if (months < 1) return 'Newborn'
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} old`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m > 0 ? `${y}y ${m}mo old` : `${y} year${y !== 1 ? 's' : ''} old`
}

function pctLabel(pct) {
  if (pct == null) return '—'
  const p = Math.round(pct)
  if (p <= 3)  return `${p}th · Low`
  if (p <= 15) return `${p}th · Below avg`
  if (p <= 85) return `${p}th · Normal`
  if (p <= 97) return `${p}th · Above avg`
  return `${p}th · High`
}

// Returns ↑ ↓ → or null
function trendArrow(logs, type) {
  const sorted = logs
    .filter((l) => l.type === type)
    .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
  if (sorted.length < 2) return null
  const diff = sorted[0].value - sorted[1].value
  if (diff > 0) return { arrow: '↑', color: 'text-green-500' }
  if (diff < 0) return { arrow: '↓', color: 'text-red-400' }
  return { arrow: '→', color: 'text-gray-400' }
}

export default function Dashboard() {
  const [baby, setBaby]             = useState(null)
  const [logs, setLogs]             = useState([])
  const [records, setRecords]       = useState([])
  const [percentile, setPercentile] = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [showBatch, setShowBatch]     = useState(false)
  const [loading, setLoading]         = useState(true)
  const [exporting, setExporting]     = useState(false)
  const [growthSummary, setGrowthSummary]       = useState(null)
  const [summaryLoading, setSummaryLoading]     = useState(true)
  const [regenerating, setRegenerating]         = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [babyData, growthData, recordsData] = await Promise.all([
        babyService.getMyBaby(),
        growthService.getLogs(),
        uploadService.getRecords(),
      ])
      setBaby(babyData)
      setLogs(growthData)
      setRecords(recordsData)

      if (babyData && growthData.length > 0) {
        const ageMonths = getAgeMonths(babyData.birthdate)
        const weights   = growthData.filter((l) => l.type === 'weight').sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
        const heights   = growthData.filter((l) => l.type === 'height').sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
        if (weights.length || heights.length) {
          const gender = babyData.gender === 'female' ? 'girls' : 'boys'
          const pct = await growthService.getPercentile(
            ageMonths,
            weights[0]?.value ?? null,
            heights[0]?.value ?? null,
            gender
          )
          setPercentile(pct)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSummary = useCallback(async (force = false) => {
    setSummaryLoading(true)
    try {
      const data = await aiService.getGrowthSummary(force)
      setGrowthSummary(data.summary)
    } catch { setGrowthSummary(null) }
    setSummaryLoading(false)
  }, [])

  const handleRegenerate = async () => {
    setRegenerating(true)
    await fetchSummary(true)
    setRegenerating(false)
  }

  useEffect(() => {
    fetchData()
    fetchSummary()
  }, [fetchData, fetchSummary])

  const latestOf = (type) =>
    [...logs].filter((l) => l.type === type).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0]

  const latestWeight = latestOf('weight')
  const latestHeight = latestOf('height')
  const latestHead   = latestOf('head')
  const latestSleep  = latestOf('sleep')
  const latestFeed   = latestOf('feeding')

  const weightPct = percentile?.percentiles?.weight
  const heightPct = percentile?.percentiles?.height
  const ageMonths = getAgeMonths(baby?.birthdate)

  const weightTrend = trendArrow(logs, 'weight')
  const heightTrend = trendArrow(logs, 'height')
  const headTrend   = trendArrow(logs, 'head')
  const sleepTrend  = trendArrow(logs, 'sleep')

  const hasHeadData  = logs.some((l) => l.type === 'head')
  const hasSleepData = logs.some((l) => l.type === 'sleep')
  const hasFeedData  = logs.some((l) => l.type === 'feeding')

  const babyForPDF = baby
    ? { name: baby.name, birthdate: typeof baby.birthdate === 'string' ? baby.birthdate.slice(0, 10) : new Date(baby.birthdate).toISOString().slice(0, 10), gender: baby.gender, blood_type: baby.blood_type || '—' }
    : { name: 'Unknown', birthdate: new Date().toISOString().slice(0, 10), gender: '—', blood_type: '—' }

  return (
    <Layout title="Dashboard">
      <TrialBanner />

      {/* Baby card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-2xl shrink-0">👶</div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-800">{baby?.name || 'Loading…'}</h2>
          <p className="text-sm text-gray-400">
            {baby ? `${formatAge(ageMonths)} · ${baby.gender} · Blood type ${baby.blood_type || '—'}` : ''}
          </p>
        </div>
        <div className="ml-auto flex gap-2 shrink-0 flex-wrap justify-end">
          <button
            onClick={async () => {
              setExporting(true)
              try { generateGrowthPDF(babyForPDF, logs, records) }
              finally { setExporting(false) }
            }}
            disabled={exporting || !baby}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : '↓ PDF'}
          </button>
          <button
            onClick={() => setShowBatch(true)}
            className="border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
          >
            ⊞ Batch Entry
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Log
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Age"
          value={baby ? formatAge(ageMonths).replace(' old', '') : '—'}
        />
        <StatCard
          label="Weight"
          value={latestWeight ? `${latestWeight.value} kg` : '—'}
          sub={latestWeight ? new Date(latestWeight.logged_at).toLocaleDateString('en-PH') : 'Not logged'}
          trend={weightTrend}
          highlight={weightPct != null && (weightPct <= 3 || weightPct >= 97) ? 'amber' : weightPct != null ? 'green' : null}
        />
        <StatCard
          label="Height"
          value={latestHeight ? `${latestHeight.value} cm` : '—'}
          sub={latestHeight ? new Date(latestHeight.logged_at).toLocaleDateString('en-PH') : 'Not logged'}
          trend={heightTrend}
        />
        <StatCard
          label="Weight Percentile"
          value={weightPct != null ? `${Math.round(weightPct)}th` : '—'}
          sub={weightPct != null ? pctLabel(weightPct).split(' · ')[1] : 'WHO standard'}
          highlight={weightPct != null && (weightPct <= 3 || weightPct >= 97) ? 'amber' : weightPct != null ? 'green' : null}
        />
      </div>

      {/* Extra metrics row */}
      {(latestHead || latestSleep || latestFeed) && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {latestHead && (
            <StatCard
              label="Head Circ."
              value={`${latestHead.value} cm`}
              sub={new Date(latestHead.logged_at).toLocaleDateString('en-PH')}
              trend={headTrend}
            />
          )}
          {latestSleep && (
            <StatCard
              label="Sleep"
              value={`${latestSleep.value} hrs`}
              sub={new Date(latestSleep.logged_at).toLocaleDateString('en-PH')}
              trend={sleepTrend}
            />
          )}
          {latestFeed && (
            <StatCard
              label="Feeding"
              value={`${latestFeed.value} ml`}
              sub={new Date(latestFeed.logged_at).toLocaleDateString('en-PH')}
            />
          )}
        </div>
      )}

      {/* AI Growth Summary */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide">✨ AI Growth Summary</p>
          <button
            onClick={handleRegenerate}
            disabled={summaryLoading || regenerating}
            className="text-xs text-blue-200 hover:text-white border border-blue-400 hover:border-blue-200 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-40"
          >
            {regenerating ? 'Generating…' : 'Regenerate'}
          </button>
        </div>
        {summaryLoading ? (
          <SkeletonCard lines={4} height={13} className="opacity-40" />
        ) : (
          <p className="text-sm leading-relaxed">{growthSummary || 'Log growth measurements to get personalized AI insights.'}</p>
        )}
      </div>

      {/* Charts */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-300 text-sm">Loading growth data…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Weight History" sub={weightPct != null ? pctLabel(weightPct) : null}>
            <GrowthChart logs={logs} type="weight" label="Weight" color="#3B82F6" unit="kg" />
          </ChartCard>

          <ChartCard title="Height History" sub={heightPct != null ? pctLabel(heightPct) : null}>
            <GrowthChart logs={logs} type="height" label="Height" color="#10B981" unit="cm" />
          </ChartCard>

          {hasHeadData && (
            <ChartCard title="Head Circumference">
              <GrowthChart logs={logs} type="head" label="Head Circ." color="#8B5CF6" unit="cm" />
            </ChartCard>
          )}

          {hasSleepData && (
            <ChartCard title="Sleep Tracking">
              <GrowthChart logs={logs} type="sleep" label="Sleep" color="#F59E0B" unit="hrs" />
            </ChartCard>
          )}

          {hasFeedData && (
            <ChartCard title="Feeding Log">
              <GrowthChart logs={logs} type="feeding" label="Feeding" color="#EC4899" unit="ml" />
            </ChartCard>
          )}
        </div>
      )}

      {showModal && <AddGrowthModal onClose={() => setShowModal(false)} onAdded={fetchData} />}
      {showBatch && <BatchGrowthModal onClose={() => setShowBatch(false)} onAdded={fetchData} />}
    </Layout>
  )
}

function StatCard({ label, value, sub, trend, highlight }) {
  const cls =
    highlight === 'amber' ? 'border-amber-200 bg-amber-50' :
    highlight === 'green' ? 'border-green-100 bg-green-50' :
    'border-gray-100 bg-white'
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${cls}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-xl font-bold text-gray-800">{value}</p>
        {trend && <span className={`text-base font-bold ${trend.color}`}>{trend.arrow}</span>}
      </div>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
      {children}
    </div>
  )
}
