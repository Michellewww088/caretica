import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { useNavigate } from 'react-router-dom'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler)

const DEMO_DATA = {
  growth: {
    labels: ['1mo', '2mo', '3mo', '4mo', '5mo', '6mo'],
    datasets: [
      {
        label: 'Weight (kg)',
        data: [3.8, 4.9, 5.8, 6.5, 7.0, 7.5],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59,130,246,0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#3B82F6',
      },
      {
        label: 'WHO 50th pct',
        data: [4.0, 5.0, 5.9, 6.7, 7.3, 7.9],
        borderColor: '#D1D5DB',
        borderDash: [4, 4],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  },
  sleep: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sleep (hrs)',
        data: [14, 15.5, 13, 16, 14.5, 15, 13.5],
        backgroundColor: '#8B5CF6',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  },
  feeding: {
    labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
    datasets: [
      {
        label: 'Minutes',
        data: [20, 18, 22, 17, 25, 19],
        backgroundColor: '#10B981',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  },
}

const BASE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#9CA3AF' } },
    y: { grid: { color: '#F3F4F6' }, ticks: { font: { size: 9 }, color: '#9CA3AF' }, border: { display: false } },
  },
}

export default function DemoChart({ type = 'growth', blurred = true, height = 120 }) {
  const navigate = useNavigate()
  const data = DEMO_DATA[type]
  if (!data) return null

  return (
    <div className="relative" style={{ height }}>
      <div className={blurred ? 'blur-sm pointer-events-none select-none' : ''} style={{ height }}>
        {type === 'growth' ? (
          <Line data={data} options={BASE_OPTS} />
        ) : (
          <Bar data={data} options={BASE_OPTS} />
        )}
      </div>

      {blurred && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => navigate('/premium')}
        >
          <div className="bg-white/95 rounded-xl px-4 py-2.5 shadow-sm text-center border border-blue-100">
            <p className="text-xs font-semibold text-blue-500 mb-0.5">★ Premium Feature</p>
            <p className="text-xs text-gray-500">Upgrade to unlock</p>
          </div>
        </div>
      )}
    </div>
  )
}
