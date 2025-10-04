import useSWR from 'swr';

import { getTasks, GetTasksParams } from '@/services/taskApi';

import { TaskListResponse } from '@/types/task';

type UseTasksResult = {
  data: TaskListResponse | undefined;
  isLoading: boolean;
  error: any;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
};

/**
 * 팀 태스크 목록을 SWR로 가져오는 Custom Hook
 * @param teamId - 조회할 팀 ID
 * @param options - 페이지, 정렬 등 조회 옵션
 * @returns 태스크 데이터, 로딩 상태, 에러 객체
 */
export function useTasks(teamId?: string | number, options?: GetTasksParams): UseTasksResult {
  const key = teamId ? ['tasks', String(teamId), options] : null;

  const { data, isLoading, error, mutate } = useSWR<TaskListResponse>(key, () =>
    getTasks(teamId!, options ?? {})
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}
