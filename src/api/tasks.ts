import axiosInstance from '@/lib/axiosInstance';
import { Task } from '@/types/task';

/**
 *
 * @param teamId
 * @returns
 */
export const getTasksByTeam = async (teamId: string): Promise<Task[]> => {
  try {
    const response = await axiosInstance.get(`/api/v1/teams/${teamId}/tasks`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tasks for team ${teamId}:`, error);
    return [];
  }
};

/**
 *
 * @param teamId
 * @param taskData
 * @returns
 */
export const createTask = async (
  teamId: string,
  taskData: Omit<Task, 'task_id' | 'team_id'>
): Promise<Task> => {
  try {
    const response = await axiosInstance.post(`/api/v1/teams/${teamId}/tasks`, taskData);
    return response.data;
  } catch (error) {
    console.error(`Error creating task for team ${teamId}:`, error);
    throw error;
  }
};

/**
 *
 * @param taskId
 * @param taskData
 * @returns
 */
export const updateTask = async (
  taskId: number,
  taskData: Partial<Omit<Task, 'task_id' | 'team_id'>>
): Promise<Task> => {
  try {
    // PUT은 전체 리소스를 교체, PATCH는 일부 필드만 변경합니다. 백엔드 구현에 따라 선택하세요.
    const response = await axiosInstance.patch(`/api/v1/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

/**
 *
 * @param taskId
 */
export const deleteTask = async (taskId: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/v1/tasks/${taskId}`);
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};
