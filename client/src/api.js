import { findStaticExercise, listStaticBodyParts, listStaticExercises } from './staticCatalog.js'

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:3000' : '')
let staticCatalogPromise = null

async function getStaticCatalog() {
  if (!staticCatalogPromise) {
    staticCatalogPromise = fetch('/data/catalog.json').then((response) => {
      if (!response.ok) throw new Error('Static catalog is unavailable')
      return response.json()
    })
  }
  return staticCatalogPromise
}

async function getJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options)
  if (!response.ok) {
    let message = '数据加载失败，请确认后端服务已启动。'
    try {
      const body = await response.json()
      if (body.error) message = body.error
    } catch {
      // Keep the default message when the response is not JSON.
    }
    throw new Error(message)
  }
  return response.json()
}

export async function fetchBodyParts() {
  try {
    const data = await getJson('/api/body-parts')
    return data.bodyParts
  } catch (error) {
    if (import.meta.env.DEV || API_BASE) throw error
    return listStaticBodyParts(await getStaticCatalog())
  }
}

export async function fetchExercises(params = {}) {
  const query = new URLSearchParams()
  if (params.bodyPart) query.set('bodyPart', params.bodyPart)
  if (params.q) query.set('q', params.q)
  const suffix = query.toString() ? `?${query}` : ''
  try {
    const data = await getJson(`/api/exercises${suffix}`)
    return data.exercises
  } catch (error) {
    if (import.meta.env.DEV || API_BASE) throw error
    return listStaticExercises(await getStaticCatalog(), params)
  }
}

export async function fetchExercise(id) {
  try {
    const data = await getJson(`/api/exercises/${id}`)
    return data.exercise
  } catch (error) {
    if (import.meta.env.DEV || API_BASE) throw error
    const exercise = findStaticExercise(await getStaticCatalog(), id)
    if (!exercise) throw error
    return exercise
  }
}

function adminHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function adminLogin(username, password) {
  const data = await getJson('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return data.token
}

export async function fetchAdminExercises(token) {
  const data = await getJson('/api/admin/exercises', {
    headers: adminHeaders(token),
  })
  return data.exercises
}

export async function createAdminExercise(token, payload) {
  const data = await getJson('/api/admin/exercises', {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  })
  return data.exercise
}

export async function updateAdminExercise(token, id, payload) {
  const data = await getJson(`/api/admin/exercises/${id}`, {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  })
  return data.exercise
}

export async function deleteAdminExercise(token, id) {
  const data = await getJson(`/api/admin/exercises/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  })
  return data.ok
}
