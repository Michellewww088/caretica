import { useEffect, useState, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import Layout from '../components/Layout'
import ReminderModal from '../components/ReminderModal'
import { reminderService } from '../services/reminderService'

export default function Calendar() {
  const [events, setEvents]   = useState([])
  const [modal, setModal]     = useState(null) // null | { reminder?, defaultDate? }
  const calendarRef           = useRef(null)

  const fetchAll = useCallback(async () => {
    const data = await reminderService.getAll()
    setEvents(data)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDateClick = (info) => {
    // Pre-fill date at 09:00
    const dt = `${info.dateStr}T09:00`
    setModal({ defaultDate: dt })
  }

  const handleEventClick = (info) => {
    const ev = info.event
    setModal({
      reminder: {
        id:                  ev.id,
        type:                ev.extendedProps.type,
        title:               ev.title,
        start:               ev.startStr,
        repeat_frequency:    ev.extendedProps.repeat_frequency,
        notification_method: ev.extendedProps.notification_method,
        notes:               ev.extendedProps.notes,
      },
    })
  }

  return (
    <Layout title="Calendar">
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Vaccine', color: '#10B981' },
            { label: 'Checkup', color: '#3B82F6' },
            { label: 'Feeding', color: '#F97316' },
            { label: 'Sleep',   color: '#7C3AED' },
            { label: 'Medication', color: '#EC4899' },
            { label: 'Custom',  color: '#6B7280' },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
        <button
          onClick={() => setModal({})}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Add Reminder
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek',
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDisplay="block"
          height="auto"
          dayMaxEvents={3}
          eventClassNames="cursor-pointer"
        />
      </div>

      {modal && (
        <ReminderModal
          reminder={modal.reminder ?? null}
          defaultDate={modal.defaultDate ?? null}
          onClose={() => setModal(null)}
          onSaved={() => { fetchAll(); setModal(null) }}
        />
      )}
    </Layout>
  )
}
