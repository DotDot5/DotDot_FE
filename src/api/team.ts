// apis/team.ts
import axiosInstance from '@/lib/axiosInstance';

//팀원 조회
export const getTeamMembers = async (teamId: string) => {
  const response = await axiosInstance.get(`/api/v1/teams/${teamId}/members`);
  return response.data.data;
};

//팀원 초대
export const inviteMember = async (teamId: string, email: string) => {
  return await axiosInstance.post(`/api/v1/teams/${teamId}/members`, { email });
};

//팀원 역할 수정
export const updateMemberRole = async (teamId: string, userId: number, role: string) => {
  return await axiosInstance.patch(`/api/v1/teams/${teamId}/members/${userId}/role`, { role });
};

// 공지사항 조회
export const getTeamNotice = async (teamId: string) => {
  const response = await axiosInstance.get(`/api/v1/teams/${teamId}/notice`);
  return response.data.data.notice; // 바로 notice 문자열만 반환
};

// 공지사항 수정
export const updateTeamNotice = async (teamId: string, notice: string) => {
  const response = await axiosInstance.patch(`/api/v1/teams/${teamId}/notice`, {
    notice,
  });
  return response.data;
};

//내가 속한 팀원 조회
export const getMyTeams = async () => {
  const response = await axiosInstance.get('/api/v1/teams/me');
  return response.data.data; // [{ teamId, teamName }]
};