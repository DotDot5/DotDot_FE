// app/changepassword/page.jsx (또는 pages/change-password.jsx)
'use client'; // Next.js 13+ App Router를 사용한다면 필요합니다.

import MainLayout from '@/components/layout/MainLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // 👈 useRouter 임포트 (App Router)
// import { useRouter } from 'next/router'; // 👈 Pages Router를 사용한다면 이 줄을 사용하세요.

export default function ChangePasswordPage() {
  const router = useRouter(); // 👈 useRouter 훅 초기화

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    // 여기에 실제 비밀번호 변경 API 호출 로직을 추가하세요.
    console.log('비밀번호 변경 시도:', { currentPassword, newPassword });
    alert('비밀번호가 변경됐습니다.');
    // 성공 시 홈으로 리다이렉션 또는 메시지 표시
    // router.push('/'); // 예시: 변경 완료 후 홈으로 이동
    router.back(); // 👈 변경 완료 또는 취소 후 이전 페이지로 돌아가기
  };

  const handleCancel = () => {
    router.back(); // 👈 취소 버튼 클릭 시 이전 페이지로 돌아가기
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">비밀번호 변경</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                현재 비밀번호
              </label>
              <input
                type="password"
                id="currentPassword"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                새 비밀번호
              </label>
              <input
                type="password"
                id="newPassword"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-gray-700"
              >
                새 비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-between space-x-4">
              {' '}
              {/* 👈 버튼들을 나란히 배치하기 위한 flexbox 컨테이너 */}
              <button
                type="button" // 👈 form 제출을 방지하기 위해 type을 button으로 설정
                onClick={handleCancel} // 👈 취소 핸들러 연결
                className="w-1/2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
              >
                취소
              </button>
              <button
                type="submit"
                className="w-1/2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
              >
                비밀번호 변경
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
