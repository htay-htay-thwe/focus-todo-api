import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { Pool } from 'pg'
import { z } from 'zod'
import { MemoryTodoRepository } from './db/memoryTodoRepository.js'
import { PostgresTodoRepository } from './db/postgresTodoRepository.js'
import type { TodoRepository } from './types.js'

const idSchema = z.string().uuid()
const todoFields = {
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.union([z.string().date(), z.null()]).optional(),
}
const createSchema = z.object(todoFields).strict()
const updateSchema = z.object({ ...todoFields, title: todoFields.title.optional(), completed: z.boolean().optional() }).strict()

export function createApp(repository: TodoRepository, clientUrl = 'http://localhost:5173') {
  const app = express()
  app.disable('x-powered-by')
  app.use((_req, res, next) => {
    res.set({
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-DNS-Prefetch-Control': 'off',
      'X-Download-Options': 'noopen',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Permitted-Cross-Domain-Policies': 'none',
    })
    next()
  })
  app.use(cors({ origin: clientUrl }))
  app.use(express.json({ limit: '10kb' }))

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
  app.get('/api/todos', async (_req, res) => res.json({ data: await repository.findAll() }))

  app.get('/api/todos/:id', async (req, res) => {
    const id = idSchema.safeParse(req.params.id)
    if (!id.success) return res.status(400).json({ message: 'Invalid todo id' })
    const todo = await repository.findById(id.data)
    return todo ? res.json({ data: todo }) : res.status(404).json({ message: 'Todo not found' })
  })

  app.post('/api/todos', async (req, res) => {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors })
    return res.status(201).json({ data: await repository.create(parsed.data) })
  })

  app.patch('/api/todos/:id', async (req, res) => {
    const id = idSchema.safeParse(req.params.id)
    if (!id.success) return res.status(400).json({ message: 'Invalid todo id' })
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors })
    if (Object.keys(parsed.data).length === 0) return res.status(422).json({ message: 'At least one field is required' })
    const todo = await repository.update(id.data, parsed.data)
    return todo ? res.json({ data: todo }) : res.status(404).json({ message: 'Todo not found' })
  })

  app.delete('/api/todos/completed', async (_req, res) => res.json({ deleted: await repository.clearCompleted() }))
  app.delete('/api/todos/:id', async (req, res) => {
    const id = idSchema.safeParse(req.params.id)
    if (!id.success) return res.status(400).json({ message: 'Invalid todo id' })
    return (await repository.remove(id.data)) ? res.status(204).send() : res.status(404).json({ message: 'Todo not found' })
  })

  app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong' })
  }
  app.use(errorHandler)
  return app
}

// Vercel detects src/app.ts as the Express entry point and requires a default
// export that is the actual request handler. Pool connections are established
// lazily by pg, so importing this module during a build does not access the DB.
const vercelRepository: TodoRepository = process.env.DEMO_MODE === 'true'
  ? new MemoryTodoRepository()
  : new PostgresTodoRepository(new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.VERCEL ? { rejectUnauthorized: false } : undefined,
    }))

export default createApp(vercelRepository, process.env.CLIENT_URL)
