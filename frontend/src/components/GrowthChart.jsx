import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function GrowthChart({ logs, type, label, color, unit }) {
  const filtered = [...logs]
    .filter((l) => l.type === type)
    .sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at))

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-gray-300 text-sm">
        No {label.toLowerCase()} data yet — log your first entry
      </div>
    )
  }

  const chartData = {
    labels: filtered.map((l) =>
      new Date(l.logged_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label,
        data: filtered.map((l) => l.value),
        borderColor: color,
        backgroundColor: color + '18',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: color,
        pointHoverRadius: 7,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.parsed.y} ${unit}` },
      },
    },
    scales: {
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
    },
  }

  return <Line data={chartData} options={options} />
}
