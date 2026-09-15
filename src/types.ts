export type Priority = 'low' | 'medium' | 'high'

export interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: Priority
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTodoInput {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string | null
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  completed?: boolean
}

export interface TodoRepository {
  findAll(): Promise<Todo[]>
  findById(id: string): Promise<Todo | null>
  create(input: CreateTodoInput): Promise<Todo>
  update(id: string, input: UpdateTodoInput): Promise<Todo | null>
  remove(id: string): Promise<boolean>
  clearCompleted(): Promise<number>
}
