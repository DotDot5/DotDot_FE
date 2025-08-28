// src/hooks/useTasks.ts
import useSWR from 'swr';

import { TaskItem, listTeamTasks, createTask, updateTask, removeTask } from '@/api/tasks';

export function useTasks(teamId?: string | number) {
  const swr = useSWR<TaskItem[]>(teamId ? ['tasks', teamId] : null, () => listTeamTasks(teamId!));

  async function addTask(payload: Omit<TaskItem, 'id'>) {
    if (!teamId) return;
    const created = await createTask(teamId, payload);
    swr.mutate((prev) => (prev ? [created, ...prev] : [created]), false);
    swr.mutate();
  }

  async function patchTask(taskId: string | number, patch: Partial<Omit<TaskItem, 'id'>>) {
    if (!teamId) return;
    const updated = await updateTask(teamId, taskId, patch);
    swr.mutate((prev) => prev?.map((t) => (t.id === taskId ? updated : t)), false);
    swr.mutate();
  }

  async function deleteTask(taskId: string | number) {
    if (!teamId) return;
    await removeTask(teamId, taskId);
    swr.mutate((prev) => prev?.filter((t) => t.id !== taskId), false);
    swr.mutate();
  }

  return { ...swr, addTask, patchTask, deleteTask };
}
