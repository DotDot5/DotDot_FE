// api/meeting.ts
import axiosInstance from '@/lib/axiosInstance';
import { getTeamMembers } from './team';

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}
export type MeetingMethod = 'RECORD' | 'REALTIME';

export interface Meeting {
  meetingId: number;
  title: string;
  meetingAt: string;
  duration: number;
  participantCount: number;
  teamId: number;
}
// api/meeting.ts

export interface MeetingParticipant {
  userId: number;
  part: string;
  speakerIndex: number;
}

export interface MeetingParticipantWithName extends MeetingParticipant {
  userName: string; // 추가된 필드: 사용자 이름
  email: string;
}

export interface MeetingAgenda {
  agenda: string;
  body: string;
}

export interface MeetingDetail {
  meetingId: number;
  teamId: number;
  title: string;
  meetingAt: string; // ISO 8601 string
  meetingMethod: MeetingMethod;
  note: string;
  participants: MeetingParticipantWithName[];
  agendas: MeetingAgenda[];
}

export interface UpdateMeetingRequest {
  teamId: number;
  title: string;
  meetingAt: string;
  meetingMethod: MeetingMethod;
  note: string;
  participants: MeetingParticipant[];
  agendas: MeetingAgenda[];
}

export interface MeetingListResponse {
  meetingId: number;
  title: string;
  meetingAt: string; // ISO 8601 string
  teamId: number;
  teamName: string;
}

// 회의 생성 요청 DTO
export interface CreateMeetingRequest {
  teamId: number;
  title: string;
  meetingAt: string; // ISO 8601 datetime
  meetingMethod: MeetingMethod;
  note: string;
  participants: MeetingParticipant[];
  agendas: MeetingAgenda[];
}

// 회의 생성 응답 DTO
export interface CreateMeetingResponse {
  meetingId: number;
}

export interface SpeechLogDto {
  speakerIndex: number;
  text: string;
  startTime: number;
  endTime: number;
}

export interface MeetingSttResultResponse {
  meetingId: number;
  duration: number;
  transcript: string;
  audioId: string;
  speechLogs: SpeechLogDto[];
}

export interface MeetingSummaryResponse {
  meetingId: number;
  summary: string;
}

export interface RecommendationItem {
  title: string;
  url: string;
  description: string;
}

export interface RecommendationResponse {
  status: string;
  timestamp: string;
  data: RecommendationItem[] | RecommendationItem;
}

// 회의 목록 조회
export const getMeetings = async (
  teamId: string,
  status: 'upcoming' | 'finished'
): Promise<Meeting[]> => {
  const res = await axiosInstance.get<ApiResponse<Meeting[]>>(`/api/v1/meetings/${teamId}/list`, {
    params: { status },
  });
  return res.data.data;
};

export const getUpcomingMeetings = (teamId: string) => {
  return getMeetings(teamId, 'upcoming');
};

export const getPastMeetings = (teamId: string) => {
  return getMeetings(teamId, 'finished');
};

// 회의 상세 조회
export const getMeetingDetail = async (meetingId: number): Promise<MeetingDetail> => {
  const res = await axiosInstance.get<ApiResponse<MeetingDetail>>(
    `/api/v1/meetings/${meetingId}/preview`
  );
  return res.data.data;
};

// 회의 수정
export const updateMeetingDetail = async (
  meetingId: number,
  payload: UpdateMeetingRequest
): Promise<void> => {
  await axiosInstance.put<ApiResponse<number>>(`/api/v1/meetings/${meetingId}`, payload);
};

// 내가 속한 회의 목록 조회
export const getMyMeetingList = async (
  status?: string,
  sort: 'asc' | 'desc' = 'desc'
): Promise<MeetingListResponse[]> => {
  const params: Record<string, string> = { sort };
  if (status) {
    params.status = status;
  }

  const res = await axiosInstance.get<ApiResponse<MeetingListResponse[]>>('/api/v1/meetings/my', {
    params,
  });
  return res.data.data;
};

// 회의 생성 API 함수
export const createMeeting = async (
  payload: CreateMeetingRequest
): Promise<CreateMeetingResponse> => {
  const res = await axiosInstance.post<ApiResponse<CreateMeetingResponse>>(
    '/api/v1/meetings',
    payload
  );
  return res.data.data;
};

export const getMeetingSttResult = async (meetingId: number): Promise<MeetingSttResultResponse> => {
  const res = await axiosInstance.get<ApiResponse<MeetingSttResultResponse>>(
    `/api/v1/meetings/${meetingId}/stt-result`
  );
  return res.data.data;
};

// 회의 상세 조회 (참석자 이메일 포함)
export const getMeetingDetailWithParticipantEmails = async (
  meetingId: number
): Promise<MeetingDetail & { participants: MeetingParticipantWithName[] }> => {
  const meetingDetail = await getMeetingDetail(meetingId);

  try {
    const teamMembers = await getTeamMembers(String(meetingDetail.teamId));

    const participantsWithEmail = meetingDetail.participants.map((participant) => {
      const teamMember = teamMembers.find((member) => member.userId === participant.userId);

      return {
        ...participant,
        email: teamMember?.email || `user${participant.userId}@unknown.com`,
        userName: teamMember?.name || participant.userName,
        name: teamMember?.name || participant.userName,
      };
    });

    return {
      ...meetingDetail,
      participants: participantsWithEmail,
    };
  } catch (error) {
    console.error('팀원 정보 조회 실패:', error);

    const participantsWithPlaceholderEmail = meetingDetail.participants.map((participant) => ({
      ...participant,
      email: `user${participant.userId}@placeholder.com`,
    }));

    return {
      ...meetingDetail,
      participants: participantsWithPlaceholderEmail,
    };
  }
};


export const getMeetingSummary = async (meetingId: number): Promise<MeetingSummaryResponse> => {
  const res = await axiosInstance.get<MeetingSummaryResponse>(
    `/api/v1/meetings/${meetingId}/summary`
  );
  return res.data;
};

export const getMeetingRecommendations = async (meetingId: number) => {
  const params = { meetingId }; // ← 쿼리도 같이 보냄

  try {
    const res = await axiosInstance.get(`/api/v1/meetings/${meetingId}/recommendations`, {
      params,
    });
    // 응답 정규화 (배열/단일객체 모두 대응)
    const d = (res.data && res.data.data) ?? res.data;
    return Array.isArray(d) ? d : d ? [d] : [];
  } catch (e) {
    // 일부 환경은 오탈자 경로 사용 → fallback
    const res2 = await axiosInstance.get(`/api/v1/meetings/${meetingId}/recommandations`, {
      params,
    });
    const d2 = (res2.data && res2.data.data) ?? res2.data;
    return Array.isArray(d2) ? d2 : d2 ? [d2] : [];
  }
};

// ============================
// Chatbot APIs
// ============================
export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}
export interface ChatAskResponse {
  answer: string;
}

// 질문 전송
export const askChatbot = async (meetingId: number, question: string): Promise<ChatAskResponse> => {
  const res = await axiosInstance.post<ApiResponse<{ answer: string }>>('/api/v1/chatbot/ask', {
    meetingId,
    question,
  });
  return res.data.data;
};

// 히스토리 조회
export const getChatHistory = async (meetingId: number): Promise<ChatHistoryItem[]> => {
  const res = await axiosInstance.get<ApiResponse<ChatHistoryItem[]>>('/api/v1/chatbot/history', {
    params: { meetingId },
  });
  return res.data.data;
};

// 대화 종료(TTL 부여)
export const endChatbot = async (meetingId: number): Promise<void> => {
  await axiosInstance.post<ApiResponse<null>>('/api/v1/chatbot/end', null, {
    params: { meetingId },
  });
};

export type SummaryJobStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface SummaryStatusData {
  meetingId: number;
  status: SummaryJobStatus;
  summary?: string;
  updatedAt?: string;
}

// export interface TaskExtractRequest {
//   dryRun: boolean;
//   overwrite: boolean;
//   includeAgendas: boolean;
//   language: string; // 'ko'
//   defaultDueDays: number; // 7
// }

// // 태스크 자동 추출
// export const extractMeetingTasks = async (
//   meetingId: number,
//   payload: TaskExtractRequest
// ): Promise<void> => {
//   // 스웨거 경로: POST /api/v1/{meetingId}/tasks/extract
//   await axiosInstance.post<ApiResponse<unknown>>(`/api/v1/${meetingId}/tasks/extract`, payload);
// };
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export interface TaskExtractRequest {
  dryRun: boolean; // true: 생성하지 않고 초안(drafts)만 받음
  overwrite: boolean; // true
  includeAgendas: boolean; // true
  language: string; // 'ko'
  defaultDueDays: number; // 7
}
export interface TaskDraft {
  assigneeName: string;
  title: string;
  description: string;
  due: string; // ISO string
  priority: TaskPriority | string;
}
export interface TaskExtractResponse {
  meetingId: number;
  created: number;
  skipped: number;
  drafts: TaskDraft[];
}
export const extractMeetingTasks = async (
  meetingId: number,
  payload: TaskExtractRequest
): Promise<TaskExtractResponse> => {
  const res = await axiosInstance.post<ApiResponse<TaskExtractResponse>>(
    `/api/v1/${meetingId}/tasks/extract`,
    payload
  );
  return res.data.data;
};
export type TaskStatus = 'TODO' | 'PROCESSING' | 'DONE';
export interface CreateTaskRequest {
  title: string;
  description: string;
  assigneeId: number; // 사용자 ID
  priority: TaskPriority;
  status: TaskStatus;
  due: string; // ISO
  meetingId: number;
}
export const createTeamTask = async (teamId: number, payload: CreateTaskRequest): Promise<void> => {
  await axiosInstance.post<ApiResponse<unknown>>(`/api/v1/teams/${teamId}/tasks`, payload);
};

// 요약 생성 시작
export const startMeetingSummary = async (
  meetingId: number
): Promise<{ meetingId: number; summary?: string }> => {
  // 스웨거 경로: POST /api/v1/meetings/{meetingId}/summarize
  const res = await axiosInstance.post<ApiResponse<{ meetingId: number; summary?: string }>>(
    `/api/v1/meetings/${meetingId}/summarize`
  );
  return res.data.data;
};

// 요약 상태 조회
export const getMeetingSummaryStatus = async (meetingId: number): Promise<SummaryStatusData> => {
  // 스웨거 경로: GET /api/v1/meetings/{meetingId}/summary/status
  const res = await axiosInstance.get<ApiResponse<SummaryStatusData>>(
    `/api/v1/meetings/${meetingId}/summary/status`
  );
  return res.data.data;
};

// 자료 추천
export const createRecommendations = async (meetingId: number, limit = 5): Promise<void> => {
  // 스웨거 경로: POST /api/v1/meetings/{meetingId}/recommendations?limit=5
  await axiosInstance.post<ApiResponse<unknown>>(
    `/api/v1/meetings/${meetingId}/recommendations`,
    null,
    { params: { limit } }
  );
};

