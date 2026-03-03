import { useState } from 'react'
import { reminderService } from '../services/reminderService'
import { REMINDER_TYPES, REPEAT_OPTIONS } from '../config/reminderTypes'

function toDatetimeLocal(isoOrDb) {
  if (!isoOrDb) return ''
  return isoOrDb.replace(' ', 'T').slice(0, 16)
}

export default function ReminderModal({ reminder, defaultDate, onClose, onSaved }) {
  const isEdit = !!reminder

  const notifyArr = reminder?.notification_method?.split(',') ?? ['in-app']

  const [form, setForm] = useState({
    type:                reminder?.type ?? 'checkup',
    title:               reminder?.title ?? '',
    datetime:            toDatetimeLocal(reminder?.start ?? reminder?.datetime ?? defaultDate ?? ''),
    repeat_frequency:    reminder?.repeat_frequency ?? 'once',
    notification_method: notifyArr,
    notes:               reminder?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const toggleNotify = (method) => {
    setForm((f) => ({
      ...f,
      notification_method: f.notification_method.includes(method)
        ? f.notification_method.filter((m) => m !== method)
        : [...f.notification_method, method],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.notification_method.length) {
      setError('Select at least one notification method')
      return
    }
    setError('')
    setLoading(true)
    const payload = {
      ...form,
      notification_method: form.notification_method.join(','),
      start: form.datetime,
    }
    try {
      if (isEdit) {
        await reminderService.update(reminder.id, payload)
      } else {
        await reminderService.create(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Edit Reminder' : 'Add Reminder'}
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">
            ×
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(REMINDER_TYPES).map(([key, { label, color }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: key }))}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors ${
                    form.type === key
                      ? 'text-white border-transparent'
                      : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                  style={form.type === key ? { backgroundColor: color, borderColor: color } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 9-Month Checkup"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              required
              value={form.datetime}
              onChange={(e) => setForm((f) => ({ ...f, datetime: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Repeat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
            <select
              value={form.repeat_frequency}
              onChange={(e) => setForm((f) => ({ ...f, repeat_frequency: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Notification method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notify via</label>
            <div className="flex gap-3">
              {['in-app', 'email'].map((method) => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.notification_method.includes(method)}
                    onChange={() => toggleNotify(method)}
                    className="rounded accent-blue-500"
                  />
                  <span className="text-sm text-gray-600 capitalize">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Additional details…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
