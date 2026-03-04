import { authService } from './authService'

const API = (import.meta.env.VITE_API_URL || '') + '/api'

export const uploadService = {
  async upload(file, { babyId = 'emma', ageMonths = 8, gender = 'girls', recordType = 'checkup' } = {}) {
    const form = new FormData()
    form.append('file', file)
    form.append('baby_id', babyId)
    form.append('age_months', String(ageMonths))
    form.append('gender', gender)
    form.append('record_type', recordType)

    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      headers: authService.authHeaders(), // no Content-Type — browser sets multipart boundary
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data
  },

  async getRecords(babyId = 'emma') {
    const res = await fetch(`${API}/upload/records?baby_id=${babyId}`, {
      headers: authService.authHeaders(),
    })
    return res.json()
  },
}
