import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SkeletonCard from '../components/SkeletonCard'
import { aiService } from '../services/aiService'
import { babyService } from '../services/babyService'
import { authService } from '../services/authService'
import { getStage, getCorrectedAgeMonths } from '../config/babyStages'

function getAgeMonths(birthdate) {
  if (!birthdate) return 0
  const birth = new Date(birthdate)
  const now   = new Date()
  return Math.max(
    0,
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  )
}

export default function Chat() {
  const navigate    = useNavigate()
  const user        = authService.getUser()
  const bottomRef   = useRef(null)

  const [baby, setBaby]         = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [stage, setStage]       = useState(null)

  useEffect(() => {
    babyService.getMyBaby().then((b) => {
      if (b) {
        setBaby(b)
        const age      = getAgeMonths(b.birthdate)
        const corrected = getCorrectedAgeMonths(age, b.baby_type, b.weeks_premature)
        setStage(getStage(corrected))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    const question = text || input.trim()
    if (!question) return
    setInput('')

    const userMsg = { role: 'user', content: question, id: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const data    = await aiService.chat(question, history)
      setMessages((prev) => [
        ...prev,
        {
          role:        'assistant',
          content:     data.answer,
          source_note: data.source_note,
          is_premium:  data.is_premium_response,
          id:          Date.now() + 1,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role:    'assistant',
          content: 'Sorry, I had trouble answering that. Please try again.',
          id:      Date.now() + 1,
        },
      ])
    }
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestedQuestions = stage?.suggestedQuestions || [
    'Is my baby sleeping enough?',
    'What foods can I introduce now?',
    'When should I schedule the next checkup?',
  ]

  const isPremium = user?.is_premium

  return (
    <Layout title="AI Assistant">
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-68px-48px)]">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-800">AI Parenting Assistant</h2>
            {baby && stage && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {baby.name} · {stage.label}
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isPremium ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isPremium ? '★ Premium' : 'Free'}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Free tier disclaimer */}
        {!isPremium && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-700">
              Upgrade to Premium for personalized answers based on your baby's data
            </p>
            <button
              onClick={() => navigate('/premium')}
              className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Suggested questions (only when no messages yet) */}
        {messages.length === 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-700 px-3 py-1.5 rounded-full transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-sm text-gray-400">Ask me anything about your baby's health and development</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1">
                  🤖
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.source_note && (
                  <p className="text-[10px] text-gray-400 mt-1 px-1">{msg.source_note}</p>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1">
                🤖
              </div>
              <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a parenting question…"
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-24"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              ↑
            </button>
          </div>
          <p className="text-[10px] text-gray-300 mt-1.5 text-center">
            For medical emergencies, always contact your pediatrician or call emergency services.
          </p>
        </div>
      </div>
    </Layout>
  )
}
