import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskId } from '../types/Task';

const STORAGE_KEY = '@mycrud/tasks';

async function getAll(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export async function create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const tasks = await getAll();
  const now = new Date().toISOString();
  const newTask: Task = {
    id: cryptoRandomId(),
    title: task.title,
    description: task.description,
    createdAt: now,
    updatedAt: now,
    done: task.done ?? false,
  };
  const updated = [newTask, ...tasks];
  await saveAll(updated);
  return newTask;
}

export async function readAll(): Promise<Task[]> {
  return getAll();
}

export async function readById(id: TaskId): Promise<Task | undefined> {
  const tasks = await getAll();
  return tasks.find(t => t.id === id);
}

export async function update(id: TaskId, partial: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | undefined> {
  const tasks = await getAll();
  let updatedTask: Task | undefined;
  const updated = tasks.map(t => {
    if (t.id === id) {
      updatedTask = {
        ...t,
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      return updatedTask;
    }
    return t;
  });
  await saveAll(updated);
  return updatedTask;
}

export async function remove(id: TaskId): Promise<void> {
  const tasks = await getAll();
  const filtered = tasks.filter(t => t.id !== id);
  await saveAll(filtered);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Gerador simples de IDs
function cryptoRandomId(): string {
  // Usa Web Crypto quando disponível no ambiente
  try {
    const bytes = new Uint8Array(16);
    // @ts-ignore
    (globalThis.crypto || (globalThis as any).nativeCrypto)?.getRandomValues?.(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}