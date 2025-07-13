// apis/team.ts
import axiosInstance from '@/lib/axiosInstance';

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}
export interface Team {
  teamId: number;
  teamName: string;
}
export interface TeamMember {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  role: string;
}
export interface TeamDetail extends Team {
  notice: string;
  members: TeamMember[];
}

//팀원 조회
export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  const res = await axiosInstance.get<ApiResponse<TeamMember[]>>(`/api/v1/teams/${teamId}/members`);
  return res.data.data;
};

//팀원 초대
export const inviteMember = async (teamId: string, email: string): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(`/api/v1/teams/${teamId}/members`, { email });
};

//팀원 역할 수정
export const updateMemberRole = async (
  teamId: string,
  userId: number,
  role: string
): Promise<void> => {
  await axiosInstance.patch<ApiResponse<void>>(`/api/v1/teams/${teamId}/members/${userId}/role`, {
    role,
  });
};

// 공지사항 조회
export const getTeamNotice = async (teamId: string): Promise<string> => {
  const res = await axiosInstance.get<ApiResponse<{ notice: string }>>(
    `/api/v1/teams/${teamId}/notice`
  );
  return res.data.data.notice;
};

// 공지사항 수정
export const updateTeamNotice = async (teamId: string, notice: string): Promise<void> => {
  await axiosInstance.patch<ApiResponse<void>>(`/api/v1/teams/${teamId}/notice`, { notice });
};

//내가 속한 팀 조회
export const getMyTeams = async (): Promise<Team[]> => {
  const res = await axiosInstance.get<ApiResponse<Team[]>>('/api/v1/teams/me');
  return res.data.data;
};

// 팀 상세 조회
export const getTeamDetail = async (teamId: string): Promise<TeamDetail> => {
  const res = await axiosInstance.get<ApiResponse<TeamDetail>>(`/api/v1/teams/${teamId}`);
  return res.data.data;
};

//팀 생성
export const createTeam = async (teamName: string): Promise<number> => {
  const res = await axiosInstance.post<ApiResponse<number>>('/api/v1/teams', { teamName });
  return res.data.data;
};

// 팀 이름 수정
export const updateTeamName = async (teamId: number, teamName: string): Promise<void> => {
  await axiosInstance.patch<ApiResponse<void>>(`/api/v1/teams/${teamId}/name`, {
    teamName,
  });
};
