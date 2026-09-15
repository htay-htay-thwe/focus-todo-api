import { randomUUID } from 'node:crypto'
import type { CreateTodoInput, Todo, TodoRepository, UpdateTodoInput } from '../types.js'

export class MemoryTodoRepository implements TodoRepository {
  private todos: Todo[] = []

  async findAll() {
    return [...this.todos].sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt.localeCompare(a.createdAt))
  }

  async findById(id: string) {
    return this.todos.find((todo) => todo.id === id) ?? null
  }

  async create(input: CreateTodoInput) {
    const now = new Date().toISOString()
    const todo: Todo = {
      id: randomUUID(), title: input.title, description: input.description ?? '', completed: false,
      priority: input.priority ?? 'medium', dueDate: input.dueDate ?? null, createdAt: now, updatedAt: now,
    }
    this.todos.unshift(todo)
    return todo
  }

  async update(id: string, input: UpdateTodoInput) {
    const todo = await this.findById(id)
    if (!todo) return null
    Object.assign(todo, input, { updatedAt: new Date().toISOString() })
    return todo
  }

  async remove(id: string) {
    const previousLength = this.todos.length
    this.todos = this.todos.filter((todo) => todo.id !== id)
    return previousLength !== this.todos.length
  }

  async clearCompleted() {
    const previousLength = this.todos.length
    this.todos = this.todos.filter((todo) => !todo.completed)
    return previousLength - this.todos.length
  }
}
