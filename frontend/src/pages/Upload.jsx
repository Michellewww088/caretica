import { useEffect, useRef, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import { uploadService } from '../services/uploadService'
import { babyService } from '../services/babyService'
import { generateGrowthPDF } from '../services/pdfService'

function getAgeMonths(birthdate) {
  if (!birthdate) return 8
  const birth = new Date(birthdate)
  const now   = new Date()
  return Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()))
}

const ACCEPT = '.jpg,.jpeg,.png,.pdf'
const MAX_MB = 10

function formatBytes(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function pctBadge(pct) {
  if (pct == null) return null
  const p = Math.round(pct)
  const color =
    p <= 3 || p >= 97 ? 'bg-amber-100 text-amber-700' :
    p <= 15 || p >= 85 ? 'bg-yellow-100 text-yellow-700' :
    'bg-green-100 text-green-700'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{p}th pct</span>
}

const STEPS = ['Uploading file', 'Running OCR', 'AI structuring', 'Saving to database']

export default function Upload() {
  const [baby, setBaby]         = useState(null)
  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus]     = useState('idle')   // idle | processing | done | error
  const [stepIdx, setStepIdx]   = useState(0)
  const [result, setResult]     = useState(null)
  const [records, setRecords]   = useState([])
  const [error, setError]       = useState('')
  const inputRef                = useRef(null)
  const stepTimer               = useRef(null)

  const fetchRecords = useCallback(async () => {
    try {
      const [babyData, data] = await Promise.all([
        babyService.getMyBaby(),
        uploadService.getRecords(),
      ])
      setBaby(babyData)
      setRecords(data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchRecords()
    return () => clearInterval(stepTimer.current)
  }, [fetchRecords])

  const setFileIfValid = (f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
      setError('Only JPG, PNG, and PDF files are allowed.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB} MB.`)
      return
    }
    setError('')
    setFile(f)
    setResult(null)
    setStatus('idle')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    setFileIfValid(e.dataTransfer.files[0])
  }

  const handleAnalyze = async () => {
    if (!file) return
    setStatus('processing')
    setStepIdx(0)
    setError('')

    // Cycle through step labels while waiting
    let i = 0
    stepTimer.current = setInterval(() => {
      i = Math.min(i + 1, STEPS.length - 1)
      setStepIdx(i)
    }, 1800)

    try {
      const ageMonths = getAgeMonths(baby?.birthdate)
      const gender    = baby?.gender === 'female' ? 'girls' : 'boys'
      const data = await uploadService.upload(file, { ageMonths, gender })
      clearInterval(stepTimer.current)
      setResult(data)
      setStatus('done')
      fetchRecords()
    } catch (err) {
      clearInterval(stepTimer.current)
      setError(err.message)
      setStatus('error')
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setStatus('idle')
    setError('')
  }

  return (
    <Layout title="Upload Report">

      {/* Drop zone */}
      {status !== 'done' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mb-6 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragging
              ? 'border-blue-400 bg-blue-50'
              : file
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => setFileIfValid(e.target.files[0])}
          />

          {file ? (
            <>
              <div className="text-3xl mb-2">
                {file.name.endsWith('.pdf') ? '📄' : '🖼️'}
              </div>
              <p className="text-sm font-medium text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
              <p className="text-xs text-blue-500 mt-2">Click to change file</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3 text-gray-300">↑</div>
              <p className="text-sm font-medium text-gray-600">
                Drag & drop or <span className="text-blue-500">click to upload</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF · Max {MAX_MB} MB</p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Processing */}
      {status === 'processing' && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-700">{STEPS[stepIdx]}…</p>
          <div className="flex gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i <= stepIdx ? 'bg-blue-500' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Analyze button */}
      {file && status === 'idle' && (
        <button
          onClick={handleAnalyze}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors mb-6"
        >
          Analyze Report
        </button>
      )}

      {/* Result */}
      {status === 'done' && result && (
        <div className="space-y-4 mb-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Analysis Complete</h2>
            <button onClick={reset} className="text-sm text-blue-500 hover:underline">
              Upload another
            </button>
          </div>

          {/* AI Summary */}
          {result.extracted?.ai_summary && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">
                AI Summary
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.extracted.ai_summary}
              </p>
            </div>
          )}

          {/* Extracted data */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Extracted Data
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Date',         value: result.extracted?.date },
                { label: 'Vaccine',      value: result.extracted?.vaccine_name },
                { label: 'Weight',       value: result.extracted?.weight ? `${result.extracted.weight} kg` : null, badge: pctBadge(result.percentiles?.weight) },
                { label: 'Height',       value: result.extracted?.height ? `${result.extracted.height} cm` : null, badge: pctBadge(result.percentiles?.height) },
                { label: 'Doctor Notes', value: result.extracted?.doctor_notes, wide: true },
                { label: 'Next Visit',   value: result.extracted?.next_visit, wide: true },
              ].filter((r) => r.value).map(({ label, value, badge, wide }) => (
                <div key={label} className={wide ? 'col-span-2' : ''}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-gray-800">{value}</p>
                    {badge}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-created reminders */}
          {result.auto_reminders?.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                Auto-Created Reminders
              </p>
              <ul className="space-y-1">
                {result.auto_reminders.map((r) => (
                  <li key={r} className="text-sm text-green-700 flex items-center gap-2">
                    <span>✓</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Records history */}
      {records.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Past Records
            </h2>
            <button
              onClick={() => {
                const b = baby
                  ? { name: baby.name, birthdate: new Date(baby.birthdate).toISOString().slice(0, 10), gender: baby.gender, blood_type: baby.blood_type || '—' }
                  : { name: 'Unknown', birthdate: new Date().toISOString().slice(0, 10), gender: '—', blood_type: '—' }
                generateGrowthPDF(b, [], records)
              }}
              className="text-xs text-blue-500 hover:underline"
            >
              ↓ Export PDF
            </button>
          </div>
          <div className="space-y-2">
            {records.map((rec) => (
              <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 capitalize">
                        {rec.record_type || 'Checkup'}
                      </p>
                      {rec.vaccine_name && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {rec.vaccine_name}
                        </span>
                      )}
                    </div>
                    {rec.ai_summary && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{rec.ai_summary}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {rec.date && (
                      <p className="text-xs text-gray-400">{rec.date}</p>
                    )}
                    <div className="flex gap-2 justify-end mt-1">
                      {rec.weight && <span className="text-xs text-gray-400">{rec.weight} kg</span>}
                      {rec.height && <span className="text-xs text-gray-400">{rec.height} cm</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
