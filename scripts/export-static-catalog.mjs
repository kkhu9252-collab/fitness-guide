import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { initializeDatabase, openDatabase } from '../server/src/db.js'

const db = openDatabase(join(process.cwd(), 'server', 'data', 'fitness.db'))
initializeDatabase(db)

function parseJsonList(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const bodyParts = db
  .prepare('SELECT DISTINCT body_part AS bodyPart FROM exercises WHERE enabled = 1 ORDER BY id ASC')
  .all()
  .map((row) => row.bodyPart)
  .filter((bodyPart, index, all) => all.indexOf(bodyPart) === index)

const exercises = db
  .prepare('SELECT * FROM exercises ORDER BY id ASC')
  .all()
  .map((row) => ({
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
  }))

db.close()

const outDir = join(process.cwd(), 'client', 'public', 'data')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'catalog.json'), `${JSON.stringify({ bodyParts, exercises }, null, 2)}\n`, 'utf8')

console.log(`Exported ${exercises.length} exercises to client/public/data/catalog.json`)
