import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import { milestoneService } from '../services/milestoneService'
import { babyService } from '../services/babyService'
import { getStage, getCorrectedAgeMonths } from '../config/babyStages'

const CATEGORIES = {
  motor:    { label: 'Motor Skills',  icon: '🏃', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  social:   { label: 'Social',        icon: '😊', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  language: { label: 'Language',      icon: '💬', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  feeding:  { label: 'Feeding',       icon: '🍼', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  other:    { label: 'Other',         icon: '⭐', color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

// Predefined milestone suggestions per stage
const MILESTONE_SUGGESTIONS = {
  newborn:      ['First smile', 'First eye contact', 'First cry response', 'First feeding'],
  earlyInfant:  ['Holds head up', 'Follows objects with eyes', 'First social smile', 'Recognizes parents\' voice'],
  infant:       ['Rolls over', 'Laughs out loud', 'Grasps toys', 'Sits with support'],
  olderInfant:  ['Sits without support', 'First babble', 'Transfers objects hand to hand', 'Responds to name'],
  lateInfant:   ['Pulls to stand', 'First words', 'Waves bye-bye', 'Pincer grasp'],
  earlyToddler: ['First steps', 'Says 2-word phrases', 'Stacks blocks', 'Points to pictures'],
  toddler:      ['Runs steadily', 'Uses spoon/fork', 'Simple sentences', 'Potty training begins'],
  preschooler:  ['Dresses self', 'Counts to 10', 'Draws circles', 'Plays with other children'],
}

function getAgeMonths(birthdate) {
  if (!birthdate) return 0
  const birth = new Date(birthdate)
  const now   = new Date()
  return Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()))
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const EMPTY_FORM = { title: '', category: 'motor', achieved_at: new Date().toISOString().slice(0, 10), notes: '' }

export default function Milestones() {
  const [milestones, setMilestones] = useState([])
  const [baby, setBaby]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)   // null | 'add' | milestone object
  const [deleteId, setDeleteId]     = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [data, babyData] = await Promise.all([
        milestoneService.getAll(),
        babyService.getMyBaby(),
      ])
      setMilestones(data)
      setBaby(babyData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setModal('add')
  }

  const openEdit = (m) => {
    setForm({
      title:       m.title,
      category:    m.category,
      achieved_at: m.achieved_at.slice(0, 10),
      notes:       m.notes || '',
    })
    setModal(m)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (modal === 'add') {
        await milestoneService.create(form)
      } else {
        await milestoneService.update(modal.id, form)
      }
      setModal(null)
      fetchAll()
    } catch {}
    setSaving(false)
  }

  const handleDelete = async () => {
    await milestoneService.remove(deleteId)
    setDeleteId(null)
    fetchAll()
  }

  // Get stage suggestions
  const ageMonths    = getAgeMonths(baby?.birthdate)
  const correctedAge = baby ? getCorrectedAgeMonths(ageMonths, baby.baby_type, baby.weeks_premature) : 0
  const stage        = getStage(correctedAge)
  const suggestions  = MILESTONE_SUGGESTIONS[stage.id] || MILESTONE_SUGGESTIONS.infant

  const filtered = activeCategory === 'all'
    ? milestones
    : milestones.filter((m) => m.category === activeCategory)

  // Group by year-month for timeline
  const grouped = filtered.reduce((acc, m) => {
    const key = new Date(m.achieved_at).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <Layout title="Milestones">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''} recorded</p>
        <button
          onClick={openAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Add Milestone
        </button>
      </div>

      {/* Quick suggestions */}
      {milestones.length < 3 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2.5">
            ✨ Suggested for {stage.label} stage
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setForm({ ...EMPTY_FORM, title: s }); setModal('add') }}
                className="text-xs bg-white border border-blue-200 hover:border-blue-400 text-blue-700 px-3 py-1.5 rounded-full transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => setActiveCategory('all')}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            activeCategory === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          All
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              activeCategory === key ? `${cat.color} border` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-300 text-sm">Loading…</div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">No milestones yet</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
            Record your baby's firsts — first smile, first steps, first words!
          </p>
          <button
            onClick={openAdd}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            + Record First Milestone
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No milestones in this category yet.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([month, items]) => (
              <div key={month}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{month}</h3>
                <div className="space-y-2">
                  {items
                    .sort((a, b) => new Date(b.achieved_at) - new Date(a.achieved_at))
                    .map((m) => {
                      const cat = CATEGORIES[m.category] || CATEGORIES.other
                      return (
                        <div
                          key={m.id}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-start gap-3"
                        >
                          <span className="text-xl shrink-0 mt-0.5">{cat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-800">{m.title}</p>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cat.color}`}>
                                {cat.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.achieved_at)}</p>
                            {m.notes && (
                              <p className="text-xs text-gray-500 mt-1">{m.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => openEdit(m)}
                              className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteId(m.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              {modal === 'add' ? 'Add Milestone' : 'Edit Milestone'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Milestone</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. First smile"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: key }))}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${
                        form.category === key ? `${cat.color} border` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Date Achieved</label>
                <input
                  type="date"
                  value={form.achieved_at}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm((f) => ({ ...f, achieved_at: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special details…"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.title.trim()}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Milestone' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-2">Delete milestone?</h2>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
