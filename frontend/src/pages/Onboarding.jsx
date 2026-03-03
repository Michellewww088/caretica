import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { babyService } from '../services/babyService'
import { aiService } from '../services/aiService'
import { authService } from '../services/authService'

const BABY_TYPES = [
  { id: 'normal',     label: 'Full Term',   icon: '👶', desc: 'Born at 37+ weeks' },
  { id: 'premature',  label: 'Premature',   icon: '🏥', desc: 'Born before 37 weeks' },
  { id: 'twins',      label: 'Twins',       icon: '👫', desc: 'Multiple birth' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState('forward')

  // Step 1
  const [trackingType, setTrackingType] = useState(null) // 'baby' | 'pregnancy'

  // Step 2
  const [babyName, setBabyName] = useState('')
  const [babyBirthdate, setBabyBirthdate] = useState('')
  const [babyGender, setBabyGender] = useState('unknown')
  const [dueDate, setDueDate] = useState('')

  // Step 3
  const [babyType, setBabyType] = useState('normal')
  const [weeksPremature, setWeeksPremature] = useState('')
  const [isBreastfeeding, setIsBreastfeeding] = useState('yes')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function goNext() {
    setDirection('forward')
    setStep((s) => s + 1)
  }

  function goBack() {
    setDirection('back')
    setStep((s) => s - 1)
  }

  async function handleFinish() {
    setSaving(true)
    setError('')
    try {
      // Update baby profile if tracking a baby
      if (trackingType === 'baby') {
        const baby = await babyService.getMyBaby()
        if (baby) {
          await babyService.update(baby.id, {
            name:            babyName || baby.name,
            birthdate:       babyBirthdate || baby.birthdate,
            gender:          babyGender,
            baby_type:       babyType,
            weeks_premature: babyType === 'premature' ? parseInt(weeksPremature || 0) : 0,
          })
        }
      }

      // Complete onboarding
      const result = await aiService.completeOnboarding({
        stage:           trackingType === 'pregnancy' ? 'pregnancy' : 'baby',
        baby_type:       babyType,
        weeks_premature: weeksPremature,
        is_breastfeeding: isBreastfeeding,
        due_date:        dueDate || undefined,
      })

      // Update stored user
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user))
      }

      navigate('/home', { replace: true })
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  const canProceedStep1 = !!trackingType
  const canProceedStep2 = trackingType === 'pregnancy' ? !!dueDate : !!babyBirthdate

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-blue-500">caretica</span>
          <p className="text-sm text-gray-400 mt-1">Let's set up your profile</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 px-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex-1 flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  step > n
                    ? 'bg-blue-500 text-white'
                    : step === n
                    ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step > n ? '✓' : n}
              </div>
              {n < 3 && <div className={`h-0.5 flex-1 transition-colors ${step > n ? 'bg-blue-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">

          {/* Step 1 — Who are you tracking? */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Who are you tracking?</h2>
              <p className="text-sm text-gray-400 mb-6">We'll customize your experience</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'pregnancy', icon: '🤰', label: "I'm expecting", desc: 'Track your pregnancy' },
                  { id: 'baby',      icon: '👶', label: 'I have a baby', desc: 'Track baby\'s growth' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTrackingType(opt.id)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      trackingType === opt.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {trackingType === opt.id && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                    )}
                    <span className="text-3xl">{opt.icon}</span>
                    <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                    <span className="text-xs text-gray-400 text-center">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              {trackingType === 'baby' ? (
                <>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Tell us about your baby</h2>
                  <p className="text-sm text-gray-400 mb-6">We'll personalize tips for your little one</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Baby's Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Emma"
                        value={babyName}
                        onChange={(e) => setBabyName(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Birthday <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        value={babyBirthdate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setBabyBirthdate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Gender</label>
                      <div className="flex gap-2">
                        {['boy', 'girl', 'unknown'].map((g) => (
                          <button
                            key={g}
                            onClick={() => setBabyGender(g)}
                            className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                              babyGender === g
                                ? 'border-blue-400 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {g === 'boy' ? '👦 Boy' : g === 'girl' ? '👧 Girl' : '🤷 Unknown'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Pregnancy details</h2>
                  <p className="text-sm text-gray-400 mb-6">We'll show pregnancy-specific guidance</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Due Date <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        value={dueDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Expected Gender (optional)</label>
                      <div className="flex gap-2">
                        {['boy', 'girl', 'unknown'].map((g) => (
                          <button
                            key={g}
                            onClick={() => setBabyGender(g)}
                            className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                              babyGender === g
                                ? 'border-blue-400 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {g === 'boy' ? '👦 Boy' : g === 'girl' ? '👧 Girl' : '🤷 Unknown'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3 — Baby type + feeding */}
          {step === 3 && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                {trackingType === 'pregnancy' ? 'Almost done!' : 'Baby type & feeding'}
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                {trackingType === 'pregnancy'
                  ? 'A few more details to personalize your experience'
                  : 'This helps us show accurate WHO growth data'}
              </p>

              {trackingType === 'baby' && (
                <>
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 mb-2.5">Baby Type</p>
                    <div className="space-y-2">
                      {BABY_TYPES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setBabyType(t.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                            babyType === t.id
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xl">{t.icon}</span>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                            <p className="text-xs text-gray-400">{t.desc}</p>
                          </div>
                          {babyType === t.id && <span className="ml-auto text-blue-500 font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {babyType === 'premature' && (
                    <div className="mb-5">
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Weeks Premature</label>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        placeholder="e.g. 4"
                        value={weeksPremature}
                        onChange={(e) => setWeeksPremature(e.target.value)}
                        className="w-32 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2.5">Feeding Method</p>
                <div className="flex gap-2">
                  {[
                    { id: 'yes',     label: '🤱 Breastfeeding' },
                    { id: 'formula', label: '🍼 Formula' },
                    { id: 'both',    label: '✨ Both' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setIsBreastfeeding(f.id)}
                      className={`flex-1 py-2 px-2 rounded-xl border text-xs font-medium transition-colors ${
                        isBreastfeeding === f.id
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={goBack}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-2 py-1"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={goNext}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
              >
                {saving ? 'Setting up…' : '🎉 Finish Setup'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          You can always update these settings later
        </p>
      </div>
    </div>
  )
}
