// apis/team.ts
import axiosInstance from '@/lib/axiosInstance';

export const getTeamMembers = async (teamId: string) => {
  const response = await axiosInstance.get(`/api/v1/teams/${teamId}/members`);
  return response.data.data;
};

export const inviteMember = async (teamId: string, email: string) => {
  return await axiosInstance.post(`/api/v1/teams/${teamId}/members`, { email });
};

export const updateMemberRole = async (teamId: string, userId: number, role: string) => {
  return await axiosInstance.patch(`/api/v1/teams/${teamId}/members/${userId}/role`, { role });
};
