import dotenv from 'dotenv'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { createApp } from './app.js'
import { PostgresTodoRepository } from './db/postgresTodoRepository.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })
dotenv.config()

const port = Number(process.env.PORT ?? 3000)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function start() {
  const schemaPath = fileURLToPath(new URL('./db/schema.sql', import.meta.url))
  await pool.query(await readFile(schemaPath, 'utf8'))
  const app = createApp(new PostgresTodoRepository(pool), process.env.CLIENT_URL)
  app.listen(port, () => console.log(`Focus API ready at http://localhost:${port}`))
}

start().catch((error) => {
  console.error('Unable to start API:', error)
  process.exit(1)
})

process.on('SIGTERM', () => pool.end())
