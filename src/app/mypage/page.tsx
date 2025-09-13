'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileEditModal from './ProfileEditModal';
import TermsModal from './TermsModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import WithdrawalConfirmModal from './WithdrawModal';
import LogoutConfirmModal from './LogoutModal';
import { getUserProfile, updateUserProfile, updateProfileImage } from '@/api/user';
import { logout } from '@/api/auth';
import axiosInstance from '@/lib/axiosInstance';

export default function MyPage() {
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    profileImageUrl: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const responseData = await getUserProfile();
        setProfileData(responseData.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        alert('사용자 정보를 불러오지 못했습니다. 다시 로그인해주세요.');
        await logout();
        router.replace('/auth/login');
      }
    };
    fetchProfile();
  }, [router]);

  const handleSaveProfile = async (textData, imageAction) => {
    try {
      let newImageUrl;

      if (imageAction.file) {
        const uploadResponse = await updateProfileImage(imageAction.file);
        newImageUrl = uploadResponse.imageUrl;
      } else if (imageAction.delete) {
        newImageUrl = 'basic';
      } else {
        newImageUrl = profileData.profileImageUrl;
      }

      const finalProfileData = {
        ...textData,
        email: profileData.email,
        profileImageUrl: newImageUrl,
      };
      console.log(finalProfileData);

      const responseData = await updateUserProfile(finalProfileData);

      setProfileData(responseData.data);
      alert('프로필이 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsProfileModalOpen(false);
    }
  };

  const handleWithdrawalConfirm = async () => {
    try {
      await axiosInstance.delete('/api/v1/users/me/withdrawal');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      alert('회원 탈퇴가 완료되었습니다.');
      setIsWithdrawalModalOpen(false);
      router.replace('/auth/login');
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      alert('회원 탈퇴 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      alert('성공적으로 로그아웃되었습니다.');
      setIsLogoutModalOpen(false);
      router.replace('/auth/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-[#FFD93D] rounded-lg p-6 mb-6 flex items-center justify-between shadow-md">
          <div className="flex items-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mr-4 overflow-hidden ${
                profileData.profileImageUrl && profileData.profileImageUrl !== 'basic'
                  ? 'bg-white'
                  : 'bg-gray-300'
              }`}
            >
              {profileData.profileImageUrl && profileData.profileImageUrl !== 'basic' ? (
                <img
                  src={profileData.profileImageUrl}
                  alt={`${profileData.name}의 프로필`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-4xl text-gray-600">👤</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{profileData.name}</div>
              <div className="text-gray-700">{profileData.email}</div>
              <div className="text-gray-700">
                {profileData.department} / {profileData.position}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="text-gray-800 hover:text-gray-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div
            className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
            onClick={() => setIsTermsModalOpen(true)}
          >
            <span className="text-gray-700">서비스 이용약관</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="black"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>

          <div
            className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
            onClick={() => setIsPrivacyModalOpen(true)}
          >
            <span className="text-gray-700">개인정보처리방침</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="black"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>

          <a
            href="/mypage/changepassword"
            className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <span className="text-gray-700">비밀번호 변경</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="black"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </a>

          <div
            className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
            onClick={() => setIsWithdrawalModalOpen(true)}
          >
            <span className="text-red-500">회원탈퇴</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="black"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>

          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <span className="text-gray-700">버전</span>
            <span className="text-gray-500">1.0.0</span>
          </div>

          <div
            className="flex justify-between items-center p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setIsLogoutModalOpen(true)}
          >
            <span className="text-gray-700">로그아웃</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="black"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
        </div>
      </div>

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        initialData={profileData}
      />

      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />

      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <WithdrawalConfirmModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        onConfirm={handleWithdrawalConfirm}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </MainLayout>
  );
}
