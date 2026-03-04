import { authService } from './authService'

const API = (import.meta.env.VITE_API_URL || '') + '/api'

export const reminderService = {
  async getAll() {
    const res = await fetch(`${API}/reminders`, {
      headers: authService.authHeaders(),
    })
    return res.json()
  },

  async create(data) {
    const res = await fetch(`${API}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  async update(id, data) {
    const res = await fetch(`${API}/reminders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  async remove(id) {
    const res = await fetch(`${API}/reminders/${id}`, {
      method: 'DELETE',
      headers: authService.authHeaders(),
    })
    return res.json()
  },
}
