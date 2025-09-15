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

export interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  status: '완료' | '대기' | '진행';
  priority: '낮음' | '보통' | '높음';
  dueDate?: string;
}

export interface TeamMemberResponse {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  role: string;
  email: string;
}
