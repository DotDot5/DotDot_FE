'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/api/auth';
import Link from 'next/link';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 컴포넌트가 마운트되면 URL에서 토큰을 읽어옵니다.
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('유효하지 않은 접근입니다. 비밀번호 찾기를 다시 시도해주세요.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!token) {
      setError('토큰 정보가 없습니다. 다시 시도해주세요.');
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await resetPassword({ token, newPassword });
      setMessage('비밀번호가 성공적으로 변경되었습니다.');
    } catch (err: any) {
      console.error('Reset password error:', err);

      // 백엔드에서 보낸 에러 코드 확인
      const errorCode = err?.response?.data?.code;

      switch (errorCode) {
        case 'USER-007':
          setError('유효하지 않은 재설정 요청입니다. 비밀번호 찾기를 다시 시도해주세요.');
          break;
        case 'USER-008':
          setError('요청이 만료되었습니다. 비밀번호 찾기를 다시 시도해주세요.');
          break;
        case 'COMMON-006':
          setError('입력값이 잘못되었습니다. 비밀번호 규칙을 확인해주세요.');
          break;
        default:
          setError('알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#666666] flex items-center justify-center">
      <div className="p-10 w-full max-w-md">
        <h1 className="text-4xl font-bold text-[#FFD93D] text-center mb-8">DotDot</h1>
        <h2 className="text-2xl font-semibold text-[#FFD93D] text-center mb-6">새 비밀번호 설정</h2>

        {message ? (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700">{message}</p>
            <Link
              href="/auth/login"
              className="text-sm mt-4 text-[#FFD93D] font-bold hover:underline inline-block"
            >
              로그인 페이지로 이동
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="password"
              placeholder="새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border rounded-[20px] px-4 py-3 w-full text-sm"
              required
            />
            <input
              type="password"
              placeholder="새 비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border rounded-[20px] px-4 py-3 w-full text-sm"
              required
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || !token}
              className="bg-[#FFD93D] rounded-[20px] py-3 font-semibold text-[#666666] disabled:bg-gray-300"
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
