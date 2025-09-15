import axiosInstance from '@/lib/axiosInstance';

/**
 * 로그인한 사용자의 프로필 정보를 가져오는 함수
 * @returns {Promise<object>} 사용자 프로필 데이터 객체
 */
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get('/api/v1/users/me');
    return response.data;
  } catch (error) {
    console.error('사용자 프로필을 가져오는 데 실패했습니다:', error);
    throw error;
  }
};

/**
 * 사용자 프로필을 업데이트하는 함수
 * @param {object} updatedData 업데이트할 프로필 데이터
 * @returns {Promise<object>} 업데이트된 사용자 프로필 데이터
 */
export const updateUserProfile = async (updatedData) => {
  try {
    const response = await axiosInstance.put('/api/v1/users/me', updatedData);
    return response.data;
  } catch (error) {
    console.error('프로필 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 사용자의 비밀번호를 변경하는 함수
 * @param {string} currentPassword 현재 비밀번호
 * @param {string} newPassword 새 비밀번호
 * @returns {Promise<object>} API 응답 데이터
 */
export const changePassword = async (currentPassword, newPassword) => {
  const requestBody = {
    currentPassword,
    newPassword,
  };

  try {
    const response = await axiosInstance.put('/api/v1/users/me/password', requestBody);
    return response.data;
  } catch (error) {
    console.error('비밀번호 변경 실패:', error);
    throw error;
  }
};

/**
 * 프로필 이미지(파일)를 서버에 업로드하는 함수
 * @param {File} file 업로드할 이미지 파일
 * @returns {Promise<object>} 업로드 결과 데이터 (새 이미지 URL 포함)
 */
export const updateProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) throw new Error('인증 토큰이 없습니다.');

  try {
    const response = await axiosInstance.put('/api/v1/users/me/profile-image', formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Content-Type 자동 처리
      },
    });

    return response.data.data; // Axios는 이미 data 안에 서버 응답이 있음
  } catch (error: any) {
    console.error('프로필 이미지 업로드 실패:', error);
    throw error;
  }
};
