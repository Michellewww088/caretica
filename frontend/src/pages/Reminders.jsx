import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import ReminderModal from '../components/ReminderModal'
import { reminderService } from '../services/reminderService'
import { REMINDER_TYPES, REPEAT_OPTIONS } from '../config/reminderTypes'

function formatDateTime(isoOrDb) {
  const dt = new Date(isoOrDb.replace(' ', 'T'))
  return dt.toLocaleString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function isPast(isoOrDb) {
  return new Date(isoOrDb.replace(' ', 'T')) < new Date()
}

export default function Reminders() {
  const [reminders, setReminders]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null) // null | 'add' | reminder object
  const [deleteId, setDeleteId]     = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await reminderService.getAll()
      setReminders(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDelete = async (id) => {
    await reminderService.remove(id)
    setDeleteId(null)
    fetchAll()
  }

  const upcoming = reminders.filter((r) => !isPast(r.start))
  const past     = reminders.filter((r) =>  isPast(r.start))

  return (
    <Layout title="Reminders">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">{upcoming.length} upcoming</p>
        <button
          onClick={() => setModal('add')}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Add Reminder
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-300 text-sm">Loading…</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-300 text-sm mb-3">No reminders yet</p>
          <button
            onClick={() => setModal('add')}
            className="text-blue-500 text-sm hover:underline"
          >
            Add your first reminder
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Upcoming
              </h2>
              <div className="space-y-2">
                {upcoming
                  .sort((a, b) => new Date(a.start) - new Date(b.start))
                  .map((r) => (
                    <ReminderCard
                      key={r.id}
                      reminder={r}
                      onEdit={() => setModal(r)}
                      onDelete={() => setDeleteId(r.id)}
                    />
                  ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Past
              </h2>
              <div className="space-y-2 opacity-60">
                {past
                  .sort((a, b) => new Date(b.start) - new Date(a.start))
                  .map((r) => (
                    <ReminderCard
                      key={r.id}
                      reminder={r}
                      onEdit={() => setModal(r)}
                      onDelete={() => setDeleteId(r.id)}
                    />
                  ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <ReminderModal
          reminder={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchAll}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-2">Delete reminder?</h2>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
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

function ReminderCard({ reminder, onEdit, onDelete }) {
  const typeInfo = REMINDER_TYPES[reminder.type] ?? REMINDER_TYPES.custom
  const repeatLabel = REPEAT_OPTIONS.find((o) => o.value === reminder.repeat_frequency)?.label ?? reminder.repeat_frequency
  const notifyMethods = (reminder.notification_method ?? '').split(',').filter(Boolean)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-start gap-3">
      {/* Color dot */}
      <div
        className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
        style={{ backgroundColor: typeInfo.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-800">{reminder.title}</p>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: typeInfo.color }}
          >
            {typeInfo.label}
          </span>
          {reminder.repeat_frequency !== 'once' && (
            <span className="text-[10px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
              {repeatLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(reminder.start)}</p>
        {reminder.notes && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{reminder.notes}</p>
        )}
        <p className="text-xs text-gray-300 mt-0.5">
          {notifyMethods.join(' + ')}
        </p>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={onEdit}
          className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
