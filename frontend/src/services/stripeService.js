import { authService } from './authService'

const API = '/api'

export const stripeService = {
  async getStatus() {
    const res = await fetch(`${API}/stripe/status`, {
      headers: authService.authHeaders(),
    })
    return res.json()
  },

  async createCheckout() {
    const res = await fetch(`${API}/stripe/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Checkout failed')
    return data
  },
}
