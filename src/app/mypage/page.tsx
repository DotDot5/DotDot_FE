// pages/mypage.jsx 또는 app/mypage/page.jsx
'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useState } from 'react';
// useRouter는 Link를 사용하지 않고도 프로그래매틱 내비게이션을 위해 여전히 유용할 수 있지만,
// <a> 태그를 직접 사용한다면 필수는 아닙니다.
// import { useRouter } from 'next/navigation'; // Next.js 13+ App Router
// import { useRouter } from 'next/router'; // Next.js Pages Router

import ProfileEditModal from './ProfileEditModal';
import TermsModal from './TermsModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import WithdrawalConfirmModal from './WithdrawModal';
import LogoutConfirmModal from './LogoutModal';

export default function MyPage() {
  // const router = useRouter(); // <a> 태그만 사용한다면 이 부분은 필요 없을 수 있습니다.

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '정태윤',
    email: 'abcd@dotdot.com',
    department: '개발팀',
    position: '학생',
  });

  const handleSaveProfile = (updatedData) => {
    console.log('프로필 저장:', updatedData);
    setProfileData(updatedData);
    setIsProfileModalOpen(false);
    alert('프로필이 성공적으로 업데이트되었습니다!');
  };

  const handleWithdrawalConfirm = () => {
    // 실제 회원 탈퇴 로직 (API 호출 등)
    console.log('회원 탈퇴 처리');
    alert('회원 탈퇴가 완료되었습니다.');
    setIsWithdrawalModalOpen(false);
    // 탈퇴 후 리다이렉션 또는 추가 처리
  };

  const handleLogoutConfirm = () => {
    // 실제 로그아웃 로직 (API 호출, 토큰 삭제 등)
    console.log('로그아웃 처리');
    alert('성공적으로 로그아웃되었습니다.');
    setIsLogoutModalOpen(false);
    // 로그아웃 후 로그인 페이지로 리다이렉션 등
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* 프로필 섹션 (이전과 동일) */}
        <div className="bg-[#E3CD64] rounded-lg p-6 mb-6 flex items-center justify-between shadow-md">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-4xl text-gray-600 mr-4 overflow-hidden">
              👤
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

        {/* 나머지 메뉴 목록 섹션 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 서비스 이용약관 버튼 */}
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

          {/* 개인정보처리방침 버튼 */}
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

          {/* 비밀번호 변경 버튼 - <a> 태그 사용 */}
          <a
            href="/mypage/changepassword" // <-- 이동할 페이지 경로
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

          {/* 회원탈퇴 버튼 */}
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

          {/* 버전 (이전과 동일) */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <span className="text-gray-700">버전</span>
            <span className="text-gray-500">1.0.0</span>
          </div>

          {/* 로그아웃 버튼 */}
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

      {/* 프로필 수정 모달 */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        initialData={profileData}
      />

      {/* 서비스 이용약관 전용 모달 */}
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />

      {/* 개인정보처리방침 전용 모달 */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* 회원탈퇴 확인 전용 모달 */}
      <WithdrawalConfirmModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        onConfirm={handleWithdrawalConfirm}
      />

      {/* 로그아웃 확인 전용 모달 */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </MainLayout>
  );
}
