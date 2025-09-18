// src/services/teamApi.ts

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
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/teams`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(teamData),
  });
  if (!response.ok) throw new Error('팀 생성에 실패했습니다.');
  const result = await response.json();
  return result.data;
};

/**
 * [GET] 내가 속한 모든 팀 목록을 조회합니다.
 */
export const fetchMyTeams = async (): Promise<MyTeamResponse[]> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/teams/me`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('내 팀 목록을 불러오는 데 실패했습니다.');
  const result = await response.json();
  return result.data;
};

/**
 * [GET] 특정 팀의 상세 정보를 조회합니다.
 */
export const fetchTeamDetails = async (teamId: string): Promise<TeamDetailResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/teams/${teamId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('팀 상세 정보를 불러오는 데 실패했습니다.');
  const result = await response.json();
  return result.data;
};

/**
 * [PATCH] 팀 이름을 수정합니다.
 */
export const updateTeamName = async (
  teamId: string,
  nameData: UpdateTeamNameRequest
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/teams/${teamId}/name`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(nameData),
  });
  if (!response.ok) throw new Error('팀 이름 수정에 실패했습니다.');
};

/**
 * [GET] 팀 공지를 조회합니다.
 */
export const fetchTeamNotice = async (teamId: string): Promise<TeamNoticeResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/teams/${teamId}/notice`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('팀 공지를 불러오는 데 실패했습니다.');
  const result = await response.json();
  return result.data;
};

/**
 * [PATCH] 팀 공지를 수정합니다.
 */
export const updateTeamNotice = async (
  teamId: string,
  noticeData: TeamNoticeRequest
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/teams/${teamId}/notice`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(noticeData),
  });
  if (!response.ok) throw new Error('팀 공지 수정에 실패했습니다.');
};

/**
 * [GET] 팀의 모든 멤버 목록을 조회합니다.
 */
export const fetchTeamMembers = async (teamId: string): Promise<TeamMemberResponse[]> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/teams/${teamId}/members`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('팀 멤버 목록을 불러오는 데 실패했습니다.');
  const result = await response.json();
  return result.data;
};

/**
 * [POST] 이메일로 팀에 새로운 멤버를 초대합니다.
 */
export const addTeamMember = async (
  teamId: string,
  memberData: AddTeamMemberRequest
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}${API_V1_PATH}/teams/${teamId}/members`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(memberData),
  });
  if (!response.ok) throw new Error('팀원 초대에 실패했습니다.');
  const result = await response.json();
  return result.data;
};

/**
 * [PATCH] 팀 멤버의 역할을 수정합니다.
 */
export const updateUserRole = async (
  teamId: string,
  userId: number,
  roleData: UserRoleUpdateRequest
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}${API_V1_PATH}/teams/${teamId}/members/${userId}/role`,
    {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(roleData),
    }
  );
  if (!response.ok) throw new Error('팀원 역할 수정에 실패했습니다.');
};
