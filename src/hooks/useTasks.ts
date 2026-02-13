import { useCallback, useEffect, useMemo, useState } from 'react';
import { Task, TaskId } from '../types/Task';
import * as store from '../storage/tasksStorage';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await store.readAll();
      setTasks(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTask = useCallback(async (input: Pick<Task, 'title' | 'description' | 'done'>) => {
    const t = await store.create(input);
    setTasks(prev => [t, ...prev]);
  }, []);

  const updateTask = useCallback(async (id: TaskId, partial: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    const t = await store.update(id, partial);
    if (t) {
      setTasks(prev => prev.map(p => (p.id === id ? t : p)));
    }
  }, []);

  const removeTask = useCallback(async (id: TaskId) => {
    await store.remove(id);
    setTasks(prev => prev.filter(p => p.id !== id));
  }, []);

  const clear = useCallback(async () => {
    await store.clearAll();
    setTasks([]);
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    return { total, done, pending: total - done };
  }, [tasks]);

  return { tasks, loading, error, load, createTask, updateTask, removeTask, clear, stats };
}