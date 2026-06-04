const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_KEY = import.meta.env.VITE_API_KEY || ''

function headers(extra = {}) {
  return { 'Content-Type': 'application/json', 'x-api-key': API_KEY, ...extra }
}

async function request(method, path, body) {
  const opts = { method, headers: headers() }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// Recipes
export const getRecipes = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return request('GET', `/api/recipes${qs ? '?' + qs : ''}`)
}
export const getRecipe     = (id)       => request('GET',    `/api/recipes/${id}`)
export const createRecipe  = (data)     => request('POST',   '/api/recipes', data)
export const updateRecipe  = (id, data) => request('PUT',    `/api/recipes/${id}`, data)
export const deleteRecipe  = (id)       => request('DELETE', `/api/recipes/${id}`)
export const getRecipeImageUrl = (id)   => `${BASE}/api/recipes/${id}/image?key=${API_KEY}`

// Tags
export const getTags = () => request('GET', '/api/tags')

// Settings
export const getSettings    = ()     => request('GET', '/api/settings')
export const updateSettings = (data) => request('PUT', '/api/settings', data)

// Ingest
export const ingestUrl  = (url, preferredUnit) =>
  request('POST', '/api/ingest/url', { url, preferredUnit })

export const ingestText = (text, preferredUnit) =>
  request('POST', '/api/ingest/text', { text, preferredUnit })

export const ingestConfirm = (draft) =>
  request('POST', '/api/ingest/confirm', draft)

// Suggestions
export const getSuggestions  = ()    => request('GET', '/api/suggestions')
export const saveSuggestion  = (url, title) => request('POST', '/api/suggestions/save', { url, title })

export async function ingestPhoto(file, preferredUnit) {
  const form = new FormData()
  form.append('file', file)
  form.append('preferredUnit', preferredUnit)
  const res = await fetch(`${BASE}/api/ingest/photo`, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}
