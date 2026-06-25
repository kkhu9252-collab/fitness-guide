import { randomBytes } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import { bodyParts, verifyPassword } from './db.js'

function parseJsonList(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function serializeExercise(row) {
  return {
    id: row.id,
    name: row.name,
    bodyPart: row.body_part,
    targetMuscles: parseJsonList(row.target_muscles),
    equipment: row.equipment,
    difficulty: row.difficulty,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    videoTips: parseJsonList(row.video_tips),
    setup: row.setup,
    steps: parseJsonList(row.steps),
    breathing: row.breathing,
    commonMistakes: parseJsonList(row.common_mistakes),
    safetyNotes: parseJsonList(row.safety_notes),
    enabled: row.enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeExercisePayload(payload) {
  const requiredStrings = ['name', 'bodyPart', 'equipment', 'difficulty', 'setup', 'breathing']
  for (const field of requiredStrings) {
    if (typeof payload[field] !== 'string' || payload[field].trim() === '') {
      return { error: `${field} is required` }
    }
  }

  const requiredLists = ['targetMuscles', 'steps', 'commonMistakes', 'safetyNotes']
  for (const field of requiredLists) {
    if (!Array.isArray(payload[field]) || payload[field].some((item) => typeof item !== 'string')) {
      return { error: `${field} must be a string array` }
    }
  }

  return {
    data: {
      name: payload.name.trim(),
      bodyPart: payload.bodyPart.trim(),
      targetMuscles: payload.targetMuscles.map((item) => item.trim()).filter(Boolean),
      equipment: payload.equipment.trim(),
      difficulty: payload.difficulty.trim(),
      imageUrl: typeof payload.imageUrl === 'string' ? payload.imageUrl.trim() : '',
      videoUrl: typeof payload.videoUrl === 'string' ? payload.videoUrl.trim() : '',
      videoTips: Array.isArray(payload.videoTips)
        ? payload.videoTips.map((item) => String(item).trim()).filter(Boolean)
        : [],
      setup: payload.setup.trim(),
      steps: payload.steps.map((item) => item.trim()).filter(Boolean),
      breathing: payload.breathing.trim(),
      commonMistakes: payload.commonMistakes.map((item) => item.trim()).filter(Boolean),
      safetyNotes: payload.safetyNotes.map((item) => item.trim()).filter(Boolean),
      enabled: payload.enabled !== false,
    },
  }
}

function getExerciseById(db, id, includeHidden = false) {
  const row = db
    .prepare(`SELECT * FROM exercises WHERE id = ? ${includeHidden ? '' : 'AND enabled = 1'}`)
    .get(id)
  return row ? serializeExercise(row) : null
}

export function createApp({ db }) {
  const app = express()
  const sessions = new Set()

  app.use(cors())
  app.use(express.json())

  function requireAdmin(req, res, next) {
    const token = req.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!token || !sessions.has(token)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    return next()
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'fitness-guide-server' })
  })

  app.get('/api/body-parts', (_req, res) => {
    res.json({ bodyParts })
  })

  app.get('/api/exercises', (req, res) => {
    const bodyPart = typeof req.query.bodyPart === 'string' ? req.query.bodyPart.trim() : ''
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const conditions = ['enabled = 1']
    const params = []

    if (bodyPart) {
      conditions.push('body_part = ?')
      params.push(bodyPart)
    }

    if (q) {
      conditions.push('(name LIKE ? OR equipment LIKE ?)')
      params.push(`%${q}%`, `%${q}%`)
    }

    const rows = db
      .prepare(`SELECT * FROM exercises WHERE ${conditions.join(' AND ')} ORDER BY id ASC`)
      .all(...params)
    res.json({ exercises: rows.map(serializeExercise) })
  })

  app.get('/api/exercises/:id', (req, res) => {
    const exercise = getExerciseById(db, Number(req.params.id))
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' })
    }
    return res.json({ exercise })
  })

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {}
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const token = randomBytes(32).toString('hex')
    sessions.add(token)
    return res.json({ token })
  })

  app.get('/api/admin/exercises', requireAdmin, (_req, res) => {
    const rows = db.prepare('SELECT * FROM exercises ORDER BY id ASC').all()
    res.json({ exercises: rows.map(serializeExercise) })
  })

  app.post('/api/admin/exercises', requireAdmin, (req, res) => {
    const normalized = normalizeExercisePayload(req.body || {})
    if (normalized.error) {
      return res.status(400).json({ error: normalized.error })
    }

    const exercise = normalized.data
    const result = db
      .prepare(
        `INSERT INTO exercises (
          name, body_part, target_muscles, equipment, difficulty, image_url, video_url, video_tips,
          setup, steps, breathing, common_mistakes, safety_notes, enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        exercise.name,
        exercise.bodyPart,
        JSON.stringify(exercise.targetMuscles),
        exercise.equipment,
        exercise.difficulty,
        exercise.imageUrl,
        exercise.videoUrl,
        JSON.stringify(exercise.videoTips),
        exercise.setup,
        JSON.stringify(exercise.steps),
        exercise.breathing,
        JSON.stringify(exercise.commonMistakes),
        JSON.stringify(exercise.safetyNotes),
        exercise.enabled ? 1 : 0,
      )

    return res.status(201).json({ exercise: getExerciseById(db, Number(result.lastInsertRowid), true) })
  })

  app.put('/api/admin/exercises/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id)
    const existing = getExerciseById(db, id, true)
    if (!existing) {
      return res.status(404).json({ error: 'Exercise not found' })
    }

    const normalized = normalizeExercisePayload(req.body || {})
    if (normalized.error) {
      return res.status(400).json({ error: normalized.error })
    }

    const exercise = normalized.data
    db.prepare(
      `UPDATE exercises SET
        name = ?,
        body_part = ?,
        target_muscles = ?,
        equipment = ?,
        difficulty = ?,
        image_url = ?,
        video_url = ?,
        video_tips = ?,
        setup = ?,
        steps = ?,
        breathing = ?,
        common_mistakes = ?,
        safety_notes = ?,
        enabled = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    ).run(
      exercise.name,
      exercise.bodyPart,
      JSON.stringify(exercise.targetMuscles),
      exercise.equipment,
      exercise.difficulty,
      exercise.imageUrl,
      exercise.videoUrl,
      JSON.stringify(exercise.videoTips),
      exercise.setup,
      JSON.stringify(exercise.steps),
      exercise.breathing,
      JSON.stringify(exercise.commonMistakes),
      JSON.stringify(exercise.safetyNotes),
      exercise.enabled ? 1 : 0,
      id,
    )

    return res.json({ exercise: getExerciseById(db, id, true) })
  })

  app.delete('/api/admin/exercises/:id', requireAdmin, (req, res) => {
    const result = db.prepare('DELETE FROM exercises WHERE id = ?').run(Number(req.params.id))
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Exercise not found' })
    }
    return res.json({ ok: true })
  })

  return app
}
