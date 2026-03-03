import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-gray-100 mb-4">404</p>
      <h1 className="text-xl font-semibold text-gray-700 mb-2">Page not found</h1>
      <p className="text-sm text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  )
}
