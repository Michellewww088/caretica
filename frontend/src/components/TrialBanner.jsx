import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { growthService } from '../services/growthService'

export default function TrialBanner() {
  const [status, setStatus] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    growthService.getTrialStatus().then(setStatus).catch(() => {})
  }, [])

  if (!status) return null
  if (status.subscription_status === 'active') return null

  const { days_left, subscription_status } = status

  if (subscription_status === 'trialing' && days_left > 0) {
    return (
      <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm text-blue-700">
          <strong>{days_left} day{days_left !== 1 ? 's' : ''}</strong> left in your free trial
        </p>
        <button
          onClick={() => navigate('/premium')}
          className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 shrink-0"
        >
          Upgrade
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-sm text-amber-700">
        Your trial has expired. Upgrade to continue using all features.
      </p>
      <button
        onClick={() => navigate('/premium')}
        className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 shrink-0"
      >
        Upgrade Now
      </button>
    </div>
  )
}
