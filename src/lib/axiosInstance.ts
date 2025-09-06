// lib/axiosInstance.ts
import axios from 'axios';
import { reissueAccessToken } from '@/api/auth';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const auth = (config.headers?.Authorization || config.headers?.authorization) as
    | string
    | undefined;
  const masked = auth ? auth.slice(0, 12) + '…' + auth.slice(-6) : 'none';
  console.log(
    '[dbg][REQ]',
    config.method?.toUpperCase(),
    config.baseURL,
    config.url,
    'Authorization=',
    masked
  );
  return config;
});

// 응답 인터셉터: accessToken 만료 시 reissue → 재요청
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.code;

    // 디버깅
    console.log('Axios Interceptor Error:', error.response);
    console.log('Status:', status);
    console.log('Error Code:', errorCode);
    // 디버깅

    // 401 + USER-003 (refresh 대상) + 첫 시도일 때
    if (
      status === 401 &&
      (errorCode === 'USER-003' || errorCode === 'USER-006') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token found');

        // reissue 요청
        const newAccessToken = await reissueAccessToken(refreshToken);
        localStorage.setItem('accessToken', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (reissueError) {
        // 재발급 실패 → 토큰 초기화 후 로그인 페이지로 이동
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(reissueError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
