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

export interface MeetingSttResultResponse {
  duration: number;
  transcript: string;
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
