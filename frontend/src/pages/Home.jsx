import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import DemoChart from '../components/DemoChart'
import SkeletonCard from '../components/SkeletonCard'
import { babyService } from '../services/babyService'
import { reminderService } from '../services/reminderService'
import { stripeService } from '../services/stripeService'
import { authService } from '../services/authService'
import { aiService } from '../services/aiService'
import {
  getStage,
  getPregnancyStage,
  getCorrectedAgeMonths,
  STAGE_COLORS,
  BABY_TYPE_CONFIG,
} from '../config/babyStages'

const API = '/api'

function getAgeMonths(birthdate) {
  if (!birthdate) return 0
  const birth = new Date(birthdate)
  const now = new Date()
  return Math.max(
    0,
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  )
}

function formatAge(months) {
  if (months < 1) return 'Newborn'
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} old`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m > 0 ? `${y}y ${m}mo old` : `${y} year${y !== 1 ? 's' : ''} old`
}

function formatTime(datetimeStr) {
  if (!datetimeStr) return ''
  return new Date(datetimeStr).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function getWeeksPregnant(dueDate) {
  if (!dueDate) return null
  const due   = new Date(dueDate)
  const now   = new Date()
  const totalPregnancyDays = 280 // 40 weeks
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  const daysPregnant = totalPregnancyDays - daysLeft
  return Math.max(1, Math.min(40, Math.round(daysPregnant / 7)))
}

function getPercentilePosition(label) {
  if (!label) return 50
  if (label.includes('Below 3rd'))   return 1
  if (label.includes('3rd–15th'))    return 9
  if (label.includes('15th–50th'))   return 32
  if (label.includes('50th–85th'))   return 67
  if (label.includes('85th–97th'))   return 91
  if (label.includes('Above 97th'))  return 99
  return 50
}

function getStatusColor(status) {
  if (status === 'normal') return 'bg-green-100 text-green-700'
  if (status === 'watch')  return 'bg-amber-100 text-amber-700'
  if (status === 'low' || status === 'high') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-500'
}

const TYPE_REMINDER_ICONS = {
  vaccine:     '💉',
  checkup:     '🩺',
  medication:  '💊',
  feeding:     '🍼',
  measurement: '📏',
  other:       '📋',
}

export default function Home() {
  const navigate = useNavigate()
  const [baby, setBaby]               = useState(null)
  const [reminders, setReminders]     = useState([])
  const [trialStatus, setTrialStatus] = useState(null)
  const [growthLogs, setGrowthLogs]   = useState([])
  const [whoData, setWhoData]         = useState(null)

  const [editingType, setEditingType]     = useState(false)
  const [newBabyType, setNewBabyType]     = useState('normal')
  const [weeksPremature, setWeeksPremature] = useState(0)
  const [savingType, setSavingType]       = useState(false)
  const [showWarnings, setShowWarnings]   = useState(false)
  const [expandedTask, setExpandedTask]   = useState(null)

  const [dailyTip, setDailyTip]       = useState(null)
  const [tipLoading, setTipLoading]   = useState(true)
  const [dataLoading, setDataLoading] = useState(true)

  const user      = authService.getUser()
  const isPregnant = user?.is_pregnant

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [babyData, reminderData, statusData] = await Promise.all([
        babyService.getMyBaby(),
        reminderService.getAll(),
        stripeService.getStatus().catch(() => null),
      ])
      setBaby(babyData)
      setReminders(reminderData)
      setTrialStatus(statusData)
      if (babyData) {
        setNewBabyType(babyData.baby_type || 'normal')
        setWeeksPremature(babyData.weeks_premature || 0)
      }
    } catch {}
    setDataLoading(false)
  }, [])

  const fetchGrowth = useCallback(async () => {
    try {
      const token = authService.getToken()
      const res = await fetch(`${API}/growth`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const logs = await res.json()
        setGrowthLogs(logs)
      }
    } catch {}
  }, [])

  const fetchTip = useCallback(async () => {
    setTipLoading(true)
    try {
      const data = await aiService.getDailyTip()
      setDailyTip(data.tip)
    } catch {
      setDailyTip(null)
    }
    setTipLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    fetchGrowth()
    fetchTip()
  }, [fetchData, fetchGrowth, fetchTip])

  // Compute WHO percentile for latest weight
  useEffect(() => {
    if (!baby || !growthLogs.length) return
    const weightLog = growthLogs.find((l) => l.type === 'weight')
    if (!weightLog) return

    const ageMonths    = getAgeMonths(baby.birthdate)
    const correctedAge = getCorrectedAgeMonths(ageMonths, baby.baby_type, baby.weeks_premature)
    const genderKey    = baby.gender === 'male' || baby.gender === 'boy' ? 'boys' : 'girls'

    const token = authService.getToken()
    fetch(`${API}/who/percentile?age=${Math.round(correctedAge)}&value=${weightLog.value}&type=weight&gender=${genderKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setWhoData(d))
      .catch(() => {})
  }, [baby, growthLogs])

  const handleSaveBabyType = async () => {
    if (!baby) return
    setSavingType(true)
    try {
      await babyService.update(baby.id, {
        baby_type:       newBabyType,
        weeks_premature: newBabyType === 'premature' ? Number(weeksPremature) : 0,
      })
      await fetchData()
      setEditingType(false)
    } catch {}
    setSavingType(false)
  }

  const ageMonths    = getAgeMonths(baby?.birthdate)
  const correctedAge = getCorrectedAgeMonths(ageMonths, baby?.baby_type, baby?.weeks_premature)
  const stage        = getStage(correctedAge)
  const colors       = STAGE_COLORS[stage.color]
  const typeConfig   = BABY_TYPE_CONFIG[baby?.baby_type || 'normal']

  // Pregnancy stage
  const weeksPregnant    = isPregnant ? getWeeksPregnant(user?.due_date) : null
  const pregnancyStage   = isPregnant && weeksPregnant ? getPregnancyStage(weeksPregnant) : null
  const pColors          = pregnancyStage ? STAGE_COLORS[pregnancyStage.color] : null

  // Today's reminders
  const today     = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const todayReminders = reminders
    .filter((r) => {
      const d = new Date(r.start)
      return r.status !== 'completed' && d >= todayStart && d < todayEnd
    })
    .slice(0, 4)

  const isTrialing = trialStatus?.subscription_status === 'trialing'
  const isActive   = trialStatus?.subscription_status === 'active'
  const daysLeft   = trialStatus?.days_left_in_trial ?? 0

  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const todayLabel = today.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })

  // Growth snapshot data
  const latestWeight = growthLogs.find((l) => l.type === 'weight')
  const latestHeight = growthLogs.find((l) => l.type === 'height')
  const pctPosition  = whoData ? getPercentilePosition(whoData.label) : null

  // Fallback tip
  const displayTip = dailyTip || stage.aiTip

  if (dataLoading) {
    return (
      <Layout title="Home">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-40 bg-gray-100 rounded-lg" />
          <div className="h-4 w-32 bg-gray-100 rounded-lg" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-24 bg-gray-100 rounded-2xl" />
        </div>
      </Layout>
    )
  }

  if (!baby && !isPregnant) {
    return (
      <Layout title="Home">
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="text-6xl mb-5">👶</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Welcome to Caretica!</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            It looks like your profile isn't set up yet. Complete onboarding to get started.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Set Up My Profile
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Home">
      {/* Trial banner */}
      {isTrialing && daysLeft <= 3 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 animate-fade-in-up">
          <p className="text-sm text-amber-700">
            ⏰ Your free trial ends in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>
          </p>
          <button
            onClick={() => navigate('/premium')}
            className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-5 animate-fade-in-up">
        <h2 className="text-base font-semibold text-gray-800">{greeting}, {user?.name?.split(' ')[0] || 'there'}!</h2>
        <p className="text-sm text-gray-400 mt-0.5">{todayLabel}</p>
      </div>

      {/* ── PREGNANCY VIEW ── */}
      {isPregnant && pregnancyStage ? (
        <>
          {/* Pregnancy stage card */}
          <div className={`rounded-2xl border p-5 mb-5 animate-fade-in-up animate-delay-1 ${pColors.bg} ${pColors.border}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{pregnancyStage.icon}</span>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${pColors.text}`}>Pregnancy</p>
                  <p className="text-base font-bold text-gray-800">{pregnancyStage.label}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pColors.bg} ${pColors.text} border ${pColors.border}`}>
                Week {weeksPregnant}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{pregnancyStage.milestone}</p>

            {user?.due_date && (
              <div className="bg-white/60 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-gray-500">
                  Due date: <strong className="text-gray-800">
                    {new Date(user.due_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </strong>
                </p>
              </div>
            )}

            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">This Trimester</p>
              <ul className="space-y-1.5">
                {pregnancyStage.tasks.map((task) => (
                  <li key={task} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${pColors.dot}`}>
                      <span className="text-white text-[9px]">✓</span>
                    </span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pregnancy AI tip */}
          <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl p-5 mb-5 text-white animate-fade-in-up animate-delay-2">
            <p className="text-xs font-semibold text-pink-200 uppercase tracking-wide mb-2">✨ Tip of the Day</p>
            <p className="text-sm leading-relaxed">
              {tipLoading ? <SkeletonCard lines={2} height={13} className="opacity-50" /> : displayTip || pregnancyStage.aiTip}
            </p>
          </div>
        </>
      ) : (
        <>
          {/* ── BABY VIEW ── */}

          {/* Baby card */}
          {baby && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 animate-fade-in-up animate-delay-1 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-2xl shrink-0">
                  {typeConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-800">{baby.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeConfig.badge}`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {formatAge(ageMonths)}
                    {baby.baby_type === 'premature' && baby.weeks_premature > 0 && (
                      <span className="text-amber-500 ml-2">· Corrected age: {formatAge(Math.round(correctedAge))}</span>
                    )}
                    {baby.baby_type === 'twins' && <span className="ml-2">· Twins</span>}
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {baby.gender} · Blood type {baby.blood_type || '—'}
                  </p>
                </div>
                <button
                  onClick={() => setEditingType(!editingType)}
                  className="text-xs text-blue-500 hover:underline shrink-0"
                >
                  Edit type
                </button>
              </div>

              {/* Baby type edit panel */}
              {editingType && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Baby Type</p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {Object.entries(BABY_TYPE_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setNewBabyType(key)}
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border transition-colors ${
                          newBabyType === key
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span>{cfg.icon}</span> {cfg.label}
                      </button>
                    ))}
                  </div>
                  {newBabyType === 'premature' && (
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 block mb-1">Weeks premature</label>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={weeksPremature}
                        onChange={(e) => setWeeksPremature(e.target.value)}
                        className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBabyType}
                      disabled={savingType}
                      className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {savingType ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingType(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Growth Snapshot */}
          {(latestWeight || latestHeight) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 animate-fade-in-up animate-delay-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Growth Snapshot</h3>
                <button onClick={() => navigate('/dashboard')} className="text-xs text-blue-500 hover:underline">
                  View full chart →
                </button>
              </div>
              <div className="flex gap-4 mb-4">
                {latestWeight && (
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-0.5">Weight</p>
                    <p className="text-lg font-bold text-gray-800">{latestWeight.value} kg</p>
                    {whoData && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(whoData.status)}`}>
                        {whoData.label}
                      </span>
                    )}
                  </div>
                )}
                {latestHeight && (
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-0.5">Height</p>
                    <p className="text-lg font-bold text-gray-800">{latestHeight.value} cm</p>
                  </div>
                )}
              </div>
              {pctPosition !== null && (
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>3rd</span>
                    <span>50th</span>
                    <span>97th</span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full">
                    <div className="absolute h-2 bg-blue-200 rounded-full" style={{ width: '100%' }} />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow"
                      style={{ left: `calc(${pctPosition}% - 6px)` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-center">WHO weight percentile</p>
                </div>
              )}
            </div>
          )}

          {/* Stage card */}
          <div className={`rounded-2xl border p-5 mb-5 animate-fade-in-up animate-delay-2 ${colors.bg} ${colors.border}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{stage.icon}</span>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>Current Stage</p>
                  <p className="text-base font-bold text-gray-800">{stage.label}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                {correctedAge < 1 ? '0–1 mo' :
                 stage.range[1] === Infinity ? `${stage.range[0]}+ mo` :
                 `${stage.range[0]}–${stage.range[1]} mo`}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{stage.milestone}</p>

            {/* Tasks — expandable accordion style */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Recommended This Stage</p>
              <div className="space-y-1.5">
                {stage.tasks.map((task, i) => (
                  <button
                    key={task}
                    onClick={() => setExpandedTask(expandedTask === i ? null : i)}
                    className="w-full flex items-start gap-2 text-sm text-gray-700 hover:bg-white/50 rounded-lg px-2 py-1.5 transition-colors text-left"
                  >
                    <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${colors.dot}`}>
                      <span className="text-white text-[9px]">✓</span>
                    </span>
                    <span className="flex-1">{task}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Tips</p>
              <ul className="space-y-1.5">
                {stage.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="shrink-0 mt-0.5">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Warning signs toggle */}
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className={`text-xs font-medium ${colors.text} flex items-center gap-1`}
            >
              ⚠ Warning signs to watch for
              <span className="text-[10px]">{showWarnings ? '▲' : '▼'}</span>
            </button>
            {showWarnings && (
              <ul className="mt-2 space-y-1.5 pl-1">
                {stage.warnings.map((w) => (
                  <li key={w} className="text-xs text-amber-700 flex items-start gap-2">
                    <span className="shrink-0">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* AI Daily Tip */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 mb-5 text-white animate-fade-in-up animate-delay-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide">✨ AI Tip of the Day</p>
              <button
                onClick={() => navigate('/chat')}
                className="text-xs text-blue-200 hover:text-white transition-colors"
              >
                Ask AI →
              </button>
            </div>
            {tipLoading ? (
              <SkeletonCard lines={3} height={13} className="opacity-40" />
            ) : (
              <p className="text-sm leading-relaxed">{displayTip}</p>
            )}
          </div>
        </>
      )}

      {/* Today's Reminders */}
      <div className="mb-6 animate-fade-in-up animate-delay-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's Reminders</h3>
          <button onClick={() => navigate('/reminders')} className="text-xs text-blue-500 hover:underline">View all</button>
        </div>

        {todayReminders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-400">No reminders scheduled for today</p>
            <button
              onClick={() => navigate('/reminders')}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              + Add a reminder
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayReminders.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                <span className="text-lg shrink-0">{TYPE_REMINDER_ICONS[r.type] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 capitalize">{r.type}</p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{formatTime(r.start)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Premium preview section */}
      {!isActive && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 animate-fade-in-up animate-delay-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-800">★ Premium Features Preview</h3>
            {isTrialing && (
              <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {daysLeft}d trial left
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-5">Explore what Premium unlocks for your baby's health journey</p>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700">AI Growth Trend</p>
                  <p className="text-xs text-gray-400">Weight curve vs. WHO standard</p>
                </div>
              </div>
              <DemoChart type="growth" blurred={true} height={110} />
            </div>

            <div className="border-t border-gray-50 pt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-0.5">Sleep Tracker</p>
                <p className="text-xs text-gray-400 mb-2">Hours per night this week</p>
                <DemoChart type="sleep" blurred={true} height={90} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-0.5">Feeding Log</p>
                <p className="text-xs text-gray-400 mb-2">Minutes per feeding today</p>
                <DemoChart type="feeding" blurred={true} height={90} />
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/premium')}
            className="w-full mt-5 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {isTrialing ? '⭐ Upgrade to Premium — ₱299/mo' : 'Start 7-Day Free Trial'}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            {isTrialing ? 'Keep access after your trial ends' : '7 days free · No credit card required'}
          </p>
        </div>
      )}

      {/* Active premium */}
      {isActive && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in-up">
          <span className="text-xl">🌟</span>
          <div>
            <p className="text-sm font-semibold text-green-700">Premium Active</p>
            <p className="text-xs text-green-600">You have full access to all features.</p>
          </div>
        </div>
      )}
    </Layout>
  )
}
