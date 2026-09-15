import dotenv from 'dotenv'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { createApp } from './app.js'
import { PostgresTodoRepository } from './db/postgresTodoRepository.js'
import { MemoryTodoRepository } from './db/memoryTodoRepository.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })
dotenv.config()

const port = Number(process.env.PORT ?? 3000)
const demoMode = process.env.DEMO_MODE === 'true'
const pool = demoMode ? null : new Pool({ connectionString: process.env.DATABASE_URL })

async function start() {
  if (pool) {
    const schemaPath = fileURLToPath(new URL('./db/schema.sql', import.meta.url))
    await pool.query(await readFile(schemaPath, 'utf8'))
  }
  const repository = pool ? new PostgresTodoRepository(pool) : new MemoryTodoRepository()
  const app = createApp(repository, process.env.CLIENT_URL)
  app.listen(port, () => console.log(`Focus API ready at http://localhost:${port}${demoMode ? ' (demo mode)' : ''}`))
}

start().catch((error) => {
  console.error('Unable to start API:', error)
  process.exit(1)
})

process.on('SIGTERM', () => pool?.end())
