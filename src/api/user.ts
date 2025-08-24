// src/api/user.js

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

// ✨ 비밀번호 변경 API 호출 함수 추가
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
