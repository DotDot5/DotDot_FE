// src/apis/auth.ts
import axiosInstance from '@/lib/axiosInstance';

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export const checkEmail = async (email: string): Promise<boolean> => {
  const res = await axiosInstance.post<ApiResponse<boolean>>('/api/v1/auth/check-email', { email });
  return res.data.data;
};

export const signup = async (data: {
  name: string;
  email: string;
  password: string;
  position: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>('/api/v1/auth/signup', data);
};

export const login = async (data: { email: string; password: string }): Promise<LoginResponse> => {
  const res = await axiosInstance.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', data);
  return res.data.data;
};

export const reissueAccessToken = async (refreshToken: string): Promise<string> => {
  const res = await axiosInstance.post<ApiResponse<string>>('/api/v1/auth/reissue', {
    refreshToken,
  });
  return res.data.data; // accessToken 문자열
};

export const logout = async (): Promise<string> => {
  const res = await axiosInstance.post<ApiResponse<string>>('/api/v1/auth/logout');
  return res.data.data; // "로그아웃 완료"
};
