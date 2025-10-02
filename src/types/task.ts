/* 태스크 상태 */
export type TaskStatus = 'TODO' | 'PROCESSING' | 'DONE';

/** 태스크 우선순위 */
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Task {
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
  due: string; // ISO 8601 형식
}

/* 태스크 목록 조회 API의 페이징 정보 타입 */
export interface TaskPage {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/* 태스크 목록 조회 API의 요약 정보 타입 */
export interface TaskSummary {
  todo: number;
  processing: number;
  done: number;
}

/* 태스크 목록 조회 API의 응답 데이터 타입 */
export interface TaskListPayload {
  items: Task[];
  summary: TaskSummary;
  page: TaskPage;
}

export interface TaskListResponse {
  status: string;
  timestamp: string;
  data: TaskListPayload;
}

/* 태스크 생성 시 요청 본문(payload) 타입 */
export interface TaskCreatePayload {
  title: string;
  description?: string;
  assigneeId?: number | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due: string; // 'YYYY-MM-DD'
  meetingId?: number | null;
}

export type ListTeamTasksParams = {
  date?: string; // 'YYYY-MM-DD'
  meetingId?: number; // 현재 회의 ID
  page?: number;
  size?: number;
  sort?: string; // 'status,asc' | 'priority,desc' 등
};

export type TaskUpdatePayload = Partial<TaskCreatePayload>;
