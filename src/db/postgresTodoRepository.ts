import { Pool } from 'pg'
import type { CreateTodoInput, Todo, TodoRepository, UpdateTodoInput } from '../types.js'

type TodoRow = {
  id: string; title: string; description: string; completed: boolean; priority: Todo['priority'];
  due_date: Date | string | null; created_at: Date | string; updated_at: Date | string
}

const mapRow = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  description: row.description,
  completed: row.completed,
  priority: row.priority,
  dueDate: row.due_date ? new Date(row.due_date).toISOString().slice(0, 10) : null,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
})

export class PostgresTodoRepository implements TodoRepository {
  constructor(private readonly pool: Pool) {}

  async findAll() {
    const { rows } = await this.pool.query<TodoRow>('SELECT * FROM todos ORDER BY completed ASC, created_at DESC')
    return rows.map(mapRow)
  }

  async findById(id: string) {
    const { rows } = await this.pool.query<TodoRow>('SELECT * FROM todos WHERE id = $1', [id])
    return rows[0] ? mapRow(rows[0]) : null
  }

  async create(input: CreateTodoInput) {
    const { rows } = await this.pool.query<TodoRow>(
      `INSERT INTO todos (title, description, priority, due_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.title, input.description ?? '', input.priority ?? 'medium', input.dueDate ?? null],
    )
    return mapRow(rows[0]!)
  }

  async update(id: string, input: UpdateTodoInput) {
    const current = await this.findById(id)
    if (!current) return null
    const next = { ...current, ...input }
    const { rows } = await this.pool.query<TodoRow>(
      `UPDATE todos SET title=$1, description=$2, completed=$3, priority=$4,
       due_date=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [next.title, next.description, next.completed, next.priority, next.dueDate, id],
    )
    return mapRow(rows[0]!)
  }

  async remove(id: string) {
    const result = await this.pool.query('DELETE FROM todos WHERE id = $1', [id])
    return result.rowCount === 1
  }

  async clearCompleted() {
    const result = await this.pool.query('DELETE FROM todos WHERE completed = TRUE')
    return result.rowCount ?? 0
  }
}
