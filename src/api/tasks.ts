import axiosInstance from '@/lib/axiosInstance';

type ApiResponse<T> = { data: T; message?: string; status: number };

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TaskItem {
  id: string | number;
  title: string;
  assigneeName: string;
  assigneeEmail?: string;
  dueDate?: string; // ISO 문자열
  important?: boolean;
  status?: TaskStatus;
}

export const listTeamTasks = async (teamId: string | number): Promise<TaskItem[]> => {
  const res = await axiosInstance.get<ApiResponse<TaskItem[]>>(`/api/v1/teams/${teamId}/tasks`);
  return res.data.data;
};

export const createTask = async (
  teamId: string | number,
  payload: Omit<TaskItem, 'id'>
): Promise<TaskItem> => {
  const res = await axiosInstance.post<ApiResponse<TaskItem>>(
    `/api/v1/teams/${teamId}/tasks`,
    payload
  );
  return res.data.data;
};

export const updateTask = async (
  teamId: string | number,
  taskId: string | number,
  patch: Partial<Omit<TaskItem, 'id'>>
): Promise<TaskItem> => {
  const res = await axiosInstance.put<ApiResponse<TaskItem>>(
    `/api/v1/teams/${teamId}/tasks/${taskId}`,
    patch
  );
  return res.data.data;
};

export const removeTask = async (
  teamId: string | number,
  taskId: string | number
): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(`/api/v1/teams/${teamId}/tasks/${taskId}`);
};
