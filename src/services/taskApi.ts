// src/services/taskService.ts (최종 완성본)

import axiosInstance from '@/lib/axiosInstance';
import {
  Task,
  TaskListResponse,
  TaskCreatePayload,
  TaskUpdatePayload,
  TaskStatus,
} from '@/types/task';

/** 태스크 목록 조회를 위한 파라미터 타입 */
export interface GetTasksParams {
  date?: string;
  meetingId?: number;
  page?: number;
  size?: number;
  sort?: string;
  assigneeUserId?: number;
}

/**
 * 특정 팀의 태스크 목록을 조회합니다.
 * @param teamId - 팀 ID
 * @param params - 조회 조건을 담은 객체
 * @returns 태스크 목록과 페이징 정보를 포함한 Promise
 */
export const getTasks = async (
  teamId: string | number,
  params: GetTasksParams
): Promise<TaskListResponse> => {
  try {
    const response = await axiosInstance.get(`/api/v1/teams/${teamId}/tasks`, { params });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching tasks for team ${teamId}:`, error);
    return {
      items: [],
      summary: { todo: 0, processing: 0, done: 0 },
      page: { number: 0, size: 10, totalElements: 0, totalPages: 0 },
    };
  }
};

/**
 * 새로운 태스크를 생성합니다.
 * @param teamId - 태스크를 생성할 팀 ID
 * @param payload - 생성할 태스크의 데이터
 * @returns 생성된 태스크 객체를 포함한 Promise
 */
export const createTask = async (
  teamId: string | number,
  payload: TaskCreatePayload
): Promise<Task> => {
  try {
    const response = await axiosInstance.post(`/api/v1/teams/${teamId}/tasks`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error creating task for team ${teamId}:`, error);
    throw error;
  }
};

/**
 * 기존 태스크의 정보를 수정합니다.
 * @param taskId - 수정할 태스크의 ID
 * @param payload - 수정할 태스크의 데이터
 * @returns 수정된 태스크 객체를 포함한 Promise
 */
export const updateTask = async (taskId: number, payload: TaskUpdatePayload): Promise<Task> => {
  try {
    const response = await axiosInstance.patch(`/api/v1/tasks/${taskId}`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

/**
 * 특정 태스크를 삭제합니다.
 * @param taskId - 삭제할 태스크의 ID
 */
export const deleteTask = async (taskId: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/v1/tasks/${taskId}`);
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};

/**
 * 태스크의 상태(대기, 진행, 완료)를 변경합니다.
 * @param taskId - 상태를 변경할 태스크의 ID
 * @param status - 새로운 상태
 */
export const updateTaskStatus = async (taskId: number, status: TaskStatus): Promise<void> => {
  try {
    await axiosInstance.patch(`/api/v1/tasks/${taskId}/status`, { status });
  } catch (error) {
    console.error(`Error changing task status for ${taskId}:`, error);
    throw error;
  }
};
