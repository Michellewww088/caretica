import { authService } from './authService'

const API = '/api'

export const aiService = {
  async getDailyTip() {
    const res = await fetch(`${API}/ai/daily-tip`, {
      headers: authService.authHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch daily tip')
    return res.json()
  },

  async chat(question, history = []) {
    const res = await fetch(`${API}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify({ question, history }),
    })
    if (!res.ok) throw new Error('Chat request failed')
    return res.json()
  },

  async getGrowthSummary(force = false) {
    const res = await fetch(`${API}/ai/growth-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify({ force }),
    })
    if (!res.ok) throw new Error('Failed to generate summary')
    return res.json()
  },

  async completeOnboarding(data) {
    const res = await fetch(`${API}/auth/complete-onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Onboarding failed')
    return res.json()
  },
}
