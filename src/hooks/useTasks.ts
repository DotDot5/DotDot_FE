import useSWR from 'swr';
import {
  listTeamTasks,
  type ListTeamTasksParams,
  type TaskItem,
  type TaskSummary,
  type TaskPage,
} from '@/api/tasks';

type UseTasksResult = {
  items: TaskItem[] | undefined;
  summary: TaskSummary | undefined;
  page: TaskPage | undefined;
  isLoading: boolean;
  error: any;
};

export function useTasks(teamId?: string | number, options?: ListTeamTasksParams): UseTasksResult {
  const key = teamId
    ? [
        'tasks',
        String(teamId),
        options?.meetingId ?? null,
        options?.date ?? null,
        options?.page ?? 0,
        options?.size ?? 10,
        options?.sort ?? '',
      ]
    : null;

  const { data, isLoading, error } = useSWR(key, () => listTeamTasks(teamId!, options ?? {}));

  return {
    items: data?.items,
    summary: data?.summary,
    page: data?.page,
    isLoading,
    error,
  };
}
