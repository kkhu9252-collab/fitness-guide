import 'dotenv/config'
import { createApp } from './app.js'
import { initializeDatabase, openDatabase } from './db.js'

const port = Number(process.env.PORT || 3000)
const db = openDatabase()

initializeDatabase(db)

const app = createApp({ db })
app.listen(port, () => {
  console.log(`Fitness guide API listening on http://localhost:${port}`)
})
