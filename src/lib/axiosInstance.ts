// lib/axiosInstance.ts
import axios from 'axios';
import { reissueAccessToken } from '@/api/auth';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    // reissue 요청이 아닐 경우에만 토큰을 헤더에 추가합니다.
    if (token && !config.url?.endsWith('/auth/reissue')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 디버깅용 로그 (필요 없으면 삭제 가능)
    const auth = config.headers?.Authorization as string | undefined;
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
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: accessToken 만료 시 reissue → 재요청
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.code;

    // 👇 실패한 요청이 재발급 요청인지 확인하는 변수 추가
    const isReissueRequest = originalRequest.url?.endsWith('/auth/reissue');

    console.log('Axios Interceptor Error:', error.response);
    console.log('Status:', status);
    console.log('Error Code:', errorCode);

    if (
      status === 401 &&
      (errorCode === 'USER-003' || errorCode === 'USER-006') &&
      !originalRequest._retry &&
      !isReissueRequest // 👈 [수정] 재발급 요청 실패 시에는 다시 시도하지 않도록 조건 추가
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token found');

        const newAccessToken = await reissueAccessToken(refreshToken);
        localStorage.setItem('accessToken', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (reissueError) {
        // 재발급 실패 → 토큰 초기화 후 로그인 페이지로 이동
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(reissueError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
