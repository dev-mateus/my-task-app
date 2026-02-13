export type TaskId = string;

export interface Task {
  id: TaskId;
  title: string;
  description?: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  done: boolean;
}