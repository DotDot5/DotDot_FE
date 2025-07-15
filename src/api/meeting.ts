// api/meeting.ts
import axiosInstance from '@/lib/axiosInstance';

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
  participants: MeetingParticipant[];
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
