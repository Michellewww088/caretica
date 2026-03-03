import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import DemoChart from '../components/DemoChart'
import { stripeService } from '../services/stripeService'

// ── Feature showcase data ────────────────────────────────────────────────────

const DEMO_RECORDS = [
  { date: 'Jan 15', type: 'Checkup', weight: '7.2 kg', height: '68 cm', notes: 'Healthy, on track' },
  { date: 'Feb 10', type: 'Vaccine', vaccine: 'Pentavalent 2nd', notes: 'No adverse reaction' },
  { date: 'Mar 01', type: 'Checkup', weight: '7.8 kg', height: '70 cm', notes: 'Excellent growth trend' },
]

const DEMO_REMINDERS = [
  { icon: '💉', title: 'Pentavalent 3rd Dose', date: 'Mar 15', time: '9:00 AM', type: 'vaccine', alert: true },
  { icon: '🩺', title: '6-Month Checkup', date: 'Mar 20', time: '2:30 PM', type: 'checkup', alert: false },
  { icon: '💊', title: 'Vitamin D Drops', date: 'Daily', time: '8:00 AM', type: 'medication', alert: false },
  { icon: '📏', title: 'Weight & Height Log', date: 'Mar 25', time: '10:00 AM', type: 'measurement', alert: true },
]

const FEATURES = [
  {
    id: 'growth',
    icon: '📈',
    title: 'Smart Growth Analysis',
    subtitle: 'AI-powered WHO percentile tracking with trend predictions',
    bullets: [
      'Weight & height plotted against WHO standards',
      'AI summary after every checkup',
      'Trend alerts when growth slows or accelerates',
      'Percentile history over time',
    ],
    demo: 'growth_chart',
  },
  {
    id: 'report',
    icon: '📄',
    title: 'Monthly Health Report',
    subtitle: 'Auto-generated PDF with full health history',
    bullets: [
      'Complete growth & vaccine history',
      'Doctor notes and AI summaries compiled',
      'Share with pediatricians instantly',
      'OCR scan of physical checkup documents',
    ],
    demo: 'pdf_preview',
  },
  {
    id: 'reminders',
    icon: '🔔',
    title: 'Advanced Reminders',
    subtitle: 'Multi-channel alerts with early notifications',
    bullets: [
      'Email + in-app reminders',
      'Early alert: 1 week before vaccines',
      'Repeat reminders (daily, weekly, monthly)',
      'Auto-reminders from uploaded medical reports',
    ],
    demo: 'reminders_list',
  },
]

const FREE_FEATURES = [
  { label: 'Growth tracking (weight & height)', ok: true },
  { label: 'WHO percentile charts', ok: true },
  { label: 'Up to 5 reminders', ok: true },
  { label: 'In-app notifications', ok: true },
  { label: 'AI growth summaries', ok: false },
  { label: 'Upload & OCR medical reports', ok: false },
  { label: 'Email reminders', ok: false },
  { label: 'PDF report export', ok: false },
  { label: 'Unlimited reminders', ok: false },
]

const PREMIUM_FEATURES = [
  { label: 'Everything in Free', ok: true },
  { label: 'AI growth summaries', ok: true },
  { label: 'Upload & OCR medical reports', ok: true },
  { label: 'Email reminders', ok: true },
  { label: 'PDF report export', ok: true },
  { label: 'Unlimited reminders', ok: true },
  { label: 'Priority support', ok: true },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function GrowthDemo() {
  return (
    <div className="mt-3">
      <DemoChart type="growth" blurred={false} height={120} />
      <div className="mt-3 bg-blue-50 rounded-xl p-3">
        <p className="text-xs font-semibold text-blue-600 mb-1">AI Insight</p>
        <p className="text-xs text-gray-700">
          Emma's weight is tracking the 50th percentile with consistent upward momentum.
          Growth rate of 0.6 kg/month is ideal for her age. Next checkup recommended at 6 months.
        </p>
      </div>
    </div>
  )
}

function PDFDemo() {
  return (
    <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden text-xs">
      {/* PDF header */}
      <div className="bg-blue-500 text-white px-4 py-2.5 flex items-center justify-between">
        <span className="font-semibold">Caretica Health Report — March 2026</span>
        <span className="opacity-70">Emma Martinez · 6 mo</span>
      </div>
      {/* Table */}
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {['Date', 'Type', 'Weight', 'Notes'].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {DEMO_RECORDS.map((r, i) => (
            <tr key={i} className="bg-white hover:bg-gray-50/50">
              <td className="px-3 py-2 text-gray-600">{r.date}</td>
              <td className="px-3 py-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  r.type === 'Vaccine' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {r.vaccine || r.type}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-600">{r.weight || '—'}</td>
              <td className="px-3 py-2 text-gray-500 truncate max-w-[120px]">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
        <span className="text-gray-400 text-[10px]">3 records · Auto-generated by Caretica</span>
        <span className="text-blue-500 text-[10px] font-medium">↓ Download PDF</span>
      </div>
    </div>
  )
}

function RemindersDemo() {
  return (
    <div className="mt-3 space-y-2">
      {DEMO_REMINDERS.map((r, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
            r.alert ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'
          }`}
        >
          <span className="text-base">{r.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{r.title}</p>
            <p className="text-[10px] text-gray-400">{r.date} · {r.time}</p>
          </div>
          {r.alert && (
            <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
              Email alert
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Premium() {
  const [status, setStatus]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [paying, setPaying]     = useState(false)
  const [error, setError]       = useState('')
  const [activeFeature, setActiveFeature] = useState('growth')
  const [params] = useSearchParams()

  const success   = params.get('success') === 'true'
  const cancelled = params.get('cancelled') === 'true'

  useEffect(() => {
    stripeService.getStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async () => {
    setError('')
    setPaying(true)
    try {
      const { url } = await stripeService.createCheckout()
      window.location.href = url
    } catch (err) {
      setError(err.message)
      setPaying(false)
    }
  }

  const isActive   = status?.subscription_status === 'active'
  const isTrialing = status?.subscription_status === 'trialing'
  const daysLeft   = status?.days_left_in_trial ?? 0
  const stripeReady = status?.stripe_configured

  const selectedFeature = FEATURES.find((f) => f.id === activeFeature) || FEATURES[0]

  return (
    <Layout title="Premium">

      {/* Banners */}
      {success && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          🎉 Payment successful! Your Premium access is now active. Welcome aboard!
        </div>
      )}
      {cancelled && (
        <div className="mb-5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600">
          Checkout was cancelled. You can upgrade anytime below.
        </div>
      )}

      {/* Status card */}
      {!loading && status && (
        <div className={`mb-6 rounded-2xl border p-5 flex items-center justify-between gap-4 ${
          isActive   ? 'bg-green-50 border-green-200' :
          isTrialing ? 'bg-blue-50 border-blue-200' :
                       'bg-amber-50 border-amber-200'
        }`}>
          <div>
            <p className={`text-sm font-semibold ${
              isActive ? 'text-green-700' : isTrialing ? 'text-blue-700' : 'text-amber-700'
            }`}>
              {isActive    ? '✓ Premium — Active' :
               isTrialing  ? `◷ Free Trial — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` :
               '! Trial Expired'}
            </p>
            {isActive && status.subscription_expiry && (
              <p className="text-xs text-green-600 mt-0.5">
                Renews {new Date(status.subscription_expiry).toLocaleDateString('en-PH', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}
            {isTrialing && (
              <p className="text-xs text-blue-600 mt-0.5">
                Upgrade before your trial ends to keep all Premium features
              </p>
            )}
            {!isActive && !isTrialing && (
              <p className="text-xs text-amber-600 mt-0.5">
                Upgrade now to regain access to Premium features
              </p>
            )}
          </div>
          {isActive && (
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-lg shrink-0">
              ✓
            </div>
          )}
          {isTrialing && (
            <div className="text-center shrink-0">
              <p className="text-2xl font-bold text-blue-600">{daysLeft}</p>
              <p className="text-[10px] text-blue-400 uppercase tracking-wide">days left</p>
            </div>
          )}
        </div>
      )}

      {/* Feature Showcase */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">Explore Premium Features</h2>
        <p className="text-xs text-gray-400 mb-4">See what you unlock with a Premium subscription</p>

        {/* Feature tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FEATURES.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFeature(f.id)}
              className={`flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border font-medium transition-colors ${
                activeFeature === f.id
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span>{f.icon}</span>
              <span className="hidden sm:inline">{f.title}</span>
              <span className="sm:hidden">{f.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Feature detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{selectedFeature.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{selectedFeature.title}</p>
                <p className="text-xs text-gray-400">{selectedFeature.subtitle}</p>
              </div>
            </div>
            <ul className="space-y-2 mt-3">
              {selectedFeature.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 shrink-0 mt-0.5">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: demo */}
          <div>
            {selectedFeature.demo === 'growth_chart' && <GrowthDemo />}
            {selectedFeature.demo === 'pdf_preview'  && <PDFDemo />}
            {selectedFeature.demo === 'reminders_list' && <RemindersDemo />}
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Compare Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Free */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Free</p>
            <p className="text-3xl font-bold text-gray-800">₱0</p>
            <p className="text-sm text-gray-400 mt-0.5">7-day trial, then limited features</p>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-2.5 text-sm">
                <span className={f.ok ? 'text-green-500' : 'text-gray-200'}>{f.ok ? '✓' : '×'}</span>
                <span className={f.ok ? 'text-gray-700' : 'text-gray-300'}>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className="bg-blue-500 rounded-2xl shadow-sm p-5 text-white relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <span className="bg-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              POPULAR
            </span>
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">Premium</p>
            <p className="text-3xl font-bold">₱299</p>
            <p className="text-sm text-blue-200 mt-0.5">per month · cancel anytime</p>
          </div>
          <ul className="space-y-2.5 mb-6">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-2.5 text-sm">
                <span className="text-blue-200">✓</span>
                <span className="text-white">{f.label}</span>
              </li>
            ))}
          </ul>

          {isActive ? (
            <div className="w-full py-3 bg-white/20 rounded-xl text-sm font-medium text-center">
              ✓ Active — Thank you for subscribing!
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={paying || !stripeReady}
              className="w-full py-3 bg-white text-blue-500 rounded-xl text-sm font-semibold hover:bg-blue-50 disabled:opacity-60 transition-colors"
            >
              {paying ? 'Redirecting to checkout…' :
               !stripeReady ? 'Stripe not configured' :
               isTrialing ? 'Subscribe Now — ₱299/mo' :
               'Start 7-Day Free Trial'}
            </button>
          )}

          {!stripeReady && (
            <p className="text-xs text-blue-200 text-center mt-2">
              Add STRIPE_SECRET_KEY to backend .env to enable payments
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Accepts Visa, Mastercard, GCash, GrabPay, Maya · Secured by Stripe
      </p>
    </Layout>
  )
}
