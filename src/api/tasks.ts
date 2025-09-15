import axiosInstance from '@/lib/axiosInstance';

export interface TaskItem {
  taskId: number;
  teamId: number;
  meetingId: number;
  title: string;
  description?: string;
  assigneeUserId?: number;
  assigneeName?: string;
  assigneeProfileImageUrl?: string;
  priorityLabel?: string; // '높음' | '보통' | '낮음'
  statusLabel?: string; // '대기' | '진행' | '완료'
  due?: string; // ISO
}

export interface TaskSummary {
  todo: number;
  processing: number;
  done: number;
}

export interface TaskPage {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TaskListPayload {
  items: TaskItem[];
  summary: TaskSummary;
  page: TaskPage;
}

export interface TaskListResponse {
  status: string;
  timestamp: string;
  data: TaskListPayload;
}

export type ListTeamTasksParams = {
  date?: string; // 'YYYY-MM-DD'
  meetingId?: number; // 현재 회의 ID
  page?: number;
  size?: number;
  sort?: string; // 'status,asc' | 'priority,desc' 등
};

export async function listTeamTasks(
  teamId: string | number,
  params: ListTeamTasksParams
): Promise<TaskListPayload> {
  const res = await axiosInstance.get<TaskListResponse>(`/api/v1/teams/${teamId}/tasks`, {
    params,
  });
  const body = res.data?.data ?? {
    items: [],
    summary: { todo: 0, processing: 0, done: 0 },
    page: { number: 0, size: 10, totalElements: 0, totalPages: 0 },
  };
  const items = Array.isArray(body.items) ? body.items : [];
  return { ...body, items };
}
