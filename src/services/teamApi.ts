// src/services/teamApi.ts
import axiosInstance from '@/lib/axiosInstance';

// --- 타입 정의 ---

export interface MyTeamResponse {
  teamId: number;
  teamName: string;
}

export interface TeamDetailResponse {
  teamId: number;
  teamName: string;
  notice: string | null;
  members: TeamMemberResponse[];
}

export interface TeamMemberResponse {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  role: string;
  email: string;
}

export interface TeamNoticeResponse {
  notice: string;
}

export interface CreateTeamRequest {
  teamName: string;
}

export interface UpdateTeamNameRequest {
  teamName: string;
}

export interface TeamNoticeRequest {
  notice: string;
}

export interface AddTeamMemberRequest {
  email: string;
}

export interface UserRoleUpdateRequest {
  role: string;
}

// --- API 요청 기본 설정 ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dotdot.it.kr';
const API_V1_PATH = '/api/v1';

const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// --- 팀 API 요청 함수들 ---

/**
 * [POST] 새로운 팀을 생성합니다.
 */
export const createTeam = async (teamData: CreateTeamRequest): Promise<number> => {
  const response = await axiosInstance.post('/api/v1/teams', teamData);
  return response.data.data;
};

/**
 * [GET] 내가 속한 모든 팀 목록을 조회합니다.
 */
export const fetchMyTeams = async (): Promise<MyTeamResponse[]> => {
  const response = await axiosInstance.get('/api/v1/teams/me');
  return response.data.data;
};

/**
 * [GET] 특정 팀의 상세 정보를 조회합니다.
 */
export const fetchTeamDetails = async (teamId: string): Promise<TeamDetailResponse> => {
  const response = await axiosInstance.get(`/api/v1/teams/${teamId}`);
  return response.data.data;
};

/**
 * [PATCH] 팀 이름을 수정합니다.
 */
export const updateTeamName = async (
  teamId: string,
  nameData: UpdateTeamNameRequest
): Promise<void> => {
  await axiosInstance.patch(`/api/v1/teams/${teamId}/name`, nameData);
};

/**
 * [GET] 팀 공지를 조회합니다.
 */
export const fetchTeamNotice = async (teamId: string): Promise<TeamNoticeResponse> => {
  const response = await axiosInstance.get(`/api/v1/teams/${teamId}/notice`);
  return response.data.data;
};

/**
 * [PATCH] 팀 공지를 수정합니다.
 */
export const updateTeamNotice = async (
  teamId: string,
  noticeData: TeamNoticeRequest
): Promise<void> => {
  await axiosInstance.patch(`/api/v1/teams/${teamId}/notice`, noticeData);
};

/**
 * [GET] 팀의 모든 멤버 목록을 조회합니다.
 */
export const fetchTeamMembers = async (teamId: string): Promise<TeamMemberResponse[]> => {
  const response = await axiosInstance.get(`/api/v1/teams/${teamId}/members`);
  return response.data.data;
};

/**
 * [POST] 이메일로 팀에 새로운 멤버를 초대합니다.
 */
export const addTeamMember = async (
  teamId: string,
  memberData: AddTeamMemberRequest
): Promise<string> => {
  const response = await axiosInstance.post(`/api/v1/teams/${teamId}/members`, memberData);
  return response.data.data;
};

/**
 * [PATCH] 팀 멤버의 역할을 수정합니다.
 */
export const updateUserRole = async (
  teamId: string,
  userId: number,
  roleData: UserRoleUpdateRequest
): Promise<void> => {
  await axiosInstance.patch(`/api/v1/teams/${teamId}/members/${userId}/role`, roleData);
};
