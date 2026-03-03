const API = '/api'

export const authService = {
  async login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  async register(name, email, password) {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getToken() {
    return localStorage.getItem('token')
  },

  getUser() {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  },

  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  authHeaders() {
    return { Authorization: `Bearer ${this.getToken()}` }
  },
}
