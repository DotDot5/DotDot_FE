// src/services/taskApi.ts

// --- 타입 정의 ---
type TaskStatus = 'TODO' | 'PROCESSING' | 'DONE';
type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaskListResponse {
  items: TaskResponse[];
  summary: { todo: number; processing: number; done: number };
  page: { number: number; size: number; totalElements: number; totalPages: number };
}
export interface TaskResponse {
  taskId: number;
  teamId: number;
  meetingId: number | null;
  title: string;
  description: string;
  assigneeUserId: number | null;
  assigneeName: string | null;
  assigneeProfileImageUrl: string | null;
  priorityLabel: '높음' | '보통' | '낮음';
  statusLabel: '완료' | '진행' | '대기';
  due: string;
}
export interface TaskCreateRequest {
  title: string;
  description?: string;
  assigneeId: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  due: string;
  meetingId?: number | null;
}
export type TaskUpdateRequest = Partial<Omit<TaskCreateRequest, 'assigneeId'>> & {
  assigneeId?: number;
};

// --- API 요청 기본 설정 ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dotdot.it.kr';
const API_V1_PATH = '/api/v1';

const getAuthToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// --- 태스크 API 요청 함수들 ---
export const fetchTasks = async (
  teamId: string,
  params: {
    startDate: string;
    endDate?: string;
    meetingId?: number;
    assigneeUserId?: number;
    page?: number;
    size?: number;
    sort?: string;
  }
): Promise<TaskListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  queryParams.append('page', params.page?.toString() || '0');
  queryParams.append('size', params.size?.toString() || '100');
  queryParams.append('sort', params.sort || 'status,asc');
  if (params.meetingId) queryParams.append('meetingId', params.meetingId.toString());
  if (params.assigneeUserId) queryParams.append('assigneeUserId', params.assigneeUserId.toString());

  const response = await fetch(
    `${API_BASE_URL}${API_V1_PATH}/teams/${teamId}/tasks?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );
  if (!response.ok) throw new Error('태스크 목록을 불러오는 데 실패했습니다.');
  const result = await response.json();
  return result.data;
};

export const createTask = async (teamId: string, taskData: TaskCreateRequest): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/teams/${teamId}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(taskData),
  });
  if (!response.ok) throw new Error('태스크 생성에 실패했습니다.');
  const result = await response.json();
  return result.data;
};

export const updateTask = async (
  taskId: number,
  taskData: TaskUpdateRequest
): Promise<TaskResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(taskData),
  });
  if (!response.ok) throw new Error('태스크 수정에 실패했습니다.');
  const result = await response.json();
  return result.data;
};

export const deleteTask = async (taskId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('태스크 삭제에 실패했습니다.');
};

export const changeTaskStatus = async (taskId: number, status: TaskStatus): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('태스크 상태 변경에 실패했습니다.');
};
