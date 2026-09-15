import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import type { CreateTodoInput, Todo, TodoRepository, UpdateTodoInput } from './types.js'

class MemoryRepository implements TodoRepository {
  todos: Todo[] = []
  async findAll() { return this.todos }
  async findById(id: string) { return this.todos.find((t) => t.id === id) ?? null }
  async create(input: CreateTodoInput) { const todo: Todo = { id: crypto.randomUUID(), title: input.title, description: input.description ?? '', completed: false, priority: input.priority ?? 'medium', dueDate: input.dueDate ?? null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; this.todos.push(todo); return todo }
  async update(id: string, input: UpdateTodoInput) { const todo = await this.findById(id); if (!todo) return null; Object.assign(todo, input); return todo }
  async remove(id: string) { const length = this.todos.length; this.todos = this.todos.filter((t) => t.id !== id); return length !== this.todos.length }
  async clearCompleted() { const length = this.todos.length; this.todos = this.todos.filter((t) => !t.completed); return length - this.todos.length }
}

describe('Todo API', () => {
  it('supports the complete CRUD lifecycle', async () => {
    const app = createApp(new MemoryRepository())
    const created = await request(app).post('/api/todos').send({ title: 'Prepare interview', priority: 'high' }).expect(201)
    const id = created.body.data.id
    expect(created.body.data.completed).toBe(false)
    await request(app).get('/api/todos').expect(200).expect(({ body }) => expect(body.data).toHaveLength(1))
    await request(app).patch(`/api/todos/${id}`).send({ completed: true }).expect(200).expect(({ body }) => expect(body.data.completed).toBe(true))
    await request(app).delete(`/api/todos/${id}`).expect(204)
    await request(app).get(`/api/todos/${id}`).expect(404)
  })
  it('rejects invalid tasks', async () => { await request(createApp(new MemoryRepository())).post('/api/todos').send({ title: '   ' }).expect(422) })
})
