import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import { createApp } from '../src/app.js'
import { initializeDatabase, openDatabase } from '../src/db.js'

let tempDir
let server
let baseUrl
let db

before(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'fitness-guide-'))
  db = openDatabase(join(tempDir, 'test.db'))
  initializeDatabase(db)

  const app = createApp({ db })
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  db.close()
  rmSync(tempDir, { recursive: true, force: true })
})

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await response.json()
  return { response, body }
}

describe('database seed data', () => {
  test('initializes admin account and 20 enabled machine exercises', () => {
    const admin = db.prepare('SELECT username, password_hash FROM admins WHERE username = ?').get('admin')
    assert.equal(admin.username, 'admin')
    assert.notEqual(admin.password_hash, 'admin123')

    const count = db.prepare('SELECT COUNT(*) AS count FROM exercises WHERE enabled = 1').get()
    assert.equal(count.count, 20)

    const missingImages = db
      .prepare("SELECT COUNT(*) AS count FROM exercises WHERE image_url = '' OR image_url IS NULL")
      .get()
    assert.equal(missingImages.count, 0)
  })
})

describe('public exercise API', () => {
  test('lists body parts and enabled exercises only', async () => {
    const parts = await request('/api/body-parts')
    assert.equal(parts.response.status, 200)
    assert.deepEqual(parts.body.bodyParts, ['胸部', '背部', '腿部', '肩部', '手臂', '核心'])

    const exercises = await request('/api/exercises?bodyPart=胸部')
    assert.equal(exercises.response.status, 200)
    assert.ok(exercises.body.exercises.length >= 3)
    assert.ok(exercises.body.exercises.every((exercise) => exercise.bodyPart === '胸部'))
    assert.ok(exercises.body.exercises.every((exercise) => exercise.enabled === true))
  })

  test('searches by exercise name or equipment and returns exercise details', async () => {
    const search = await request('/api/exercises?q=推胸')
    assert.equal(search.response.status, 200)
    assert.ok(search.body.exercises.some((exercise) => exercise.name === '坐姿推胸'))

    const detail = await request(`/api/exercises/${search.body.exercises[0].id}`)
    assert.equal(detail.response.status, 200)
    assert.ok(detail.body.exercise.steps.length > 0)
    assert.ok(detail.body.exercise.safetyNotes.length > 0)
  })
})

describe('admin exercise API', () => {
  test('requires login before reading admin exercise list', async () => {
    const denied = await request('/api/admin/exercises')
    assert.equal(denied.response.status, 401)

    const login = await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    })
    assert.equal(login.response.status, 200)
    assert.equal(typeof login.body.token, 'string')

    const allowed = await request('/api/admin/exercises', {
      headers: { Authorization: `Bearer ${login.body.token}` },
    })
    assert.equal(allowed.response.status, 200)
    assert.equal(allowed.body.exercises.length, 20)
  })

  test('creates, updates, hides, and deletes an exercise', async () => {
    const login = await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    })
    const headers = { Authorization: `Bearer ${login.body.token}` }

    const created = await request('/api/admin/exercises', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: '测试器械动作',
        bodyPart: '胸部',
        targetMuscles: ['胸大肌'],
        equipment: '测试器械',
        difficulty: '新手',
        imageUrl: '',
        videoUrl: '/exercise-videos/test-machine.mp4',
        videoTips: ['侧面镜头观察动作轨迹', '每次还原到同一位置'],
        setup: '调整座椅到把手与胸部同高。',
        steps: ['握住把手', '向前推起', '慢慢还原'],
        breathing: '推起呼气，还原吸气。',
        commonMistakes: ['耸肩借力'],
        safetyNotes: ['重量从轻开始'],
        enabled: true,
      }),
    })
    assert.equal(created.response.status, 201)
    assert.equal(created.body.exercise.videoUrl, '/exercise-videos/test-machine.mp4')
    assert.deepEqual(created.body.exercise.videoTips, ['侧面镜头观察动作轨迹', '每次还原到同一位置'])

    const updated = await request(`/api/admin/exercises/${created.body.exercise.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...created.body.exercise, enabled: false }),
    })
    assert.equal(updated.response.status, 200)
    assert.equal(updated.body.exercise.enabled, false)

    const hiddenSearch = await request('/api/exercises?q=测试器械动作')
    assert.equal(hiddenSearch.body.exercises.length, 0)

    const deleted = await request(`/api/admin/exercises/${created.body.exercise.id}`, {
      method: 'DELETE',
      headers,
    })
    assert.equal(deleted.response.status, 200)
  })
})
