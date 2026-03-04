import { authService } from './authService'

const API = (import.meta.env.VITE_API_URL || '') + '/api'

export const babyService = {
  async getMyBaby() {
    const res = await fetch(`${API}/babies`, {
      headers: authService.authHeaders(),
    })
    const babies = await res.json()
    return Array.isArray(babies) ? (babies[0] || null) : null
  },

  async update(id, data) {
    const res = await fetch(`${API}/babies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify(data),
    })
    return res.json()
  },
}
