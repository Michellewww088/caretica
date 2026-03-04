import { authService } from './authService'

const API = (import.meta.env.VITE_API_URL || '') + '/api'

export const milestoneService = {
  async getAll() {
    const res = await fetch(`${API}/milestones`, {
      headers: authService.authHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch milestones')
    return res.json()
  },

  async create(data) {
    const res = await fetch(`${API}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create milestone')
    return res.json()
  },

  async update(id, data) {
    const res = await fetch(`${API}/milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update milestone')
    return res.json()
  },

  async remove(id) {
    const res = await fetch(`${API}/milestones/${id}`, {
      method: 'DELETE',
      headers: authService.authHeaders(),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete milestone')
    return res.json()
  },
}
