import { authService } from './authService'

const API = (import.meta.env.VITE_API_URL || '') + '/api'

export const growthService = {
  async getLogs() {
    const res = await fetch(`${API}/growth`, {
      headers: authService.authHeaders(),
    })
    return res.json()
  },

  async addLog(type, value, unit) {
    const res = await fetch(`${API}/growth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify({ type, value, unit }),
    })
    return res.json()
  },

  async addBatch(rows) {
    const res = await fetch(`${API}/growth/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify({ rows }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Batch save failed')
    return res.json()
  },

  async getPercentile(ageMonths, weight, height, gender = 'girls') {
    const params = new URLSearchParams({ age_months: ageMonths, gender })
    if (weight != null) params.append('weight', weight)
    if (height != null) params.append('height', height)
    const res = await fetch(`${API}/who/percentile?${params}`)
    return res.json()
  },

  async getTrialStatus() {
    const res = await fetch(`${API}/auth/trial-status`, {
      headers: authService.authHeaders(),
    })
    return res.json()
  },
}
