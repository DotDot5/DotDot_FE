'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/api/auth';
import Link from 'next/link';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await forgotPassword({ email });
      setMessage(
        '입력하신 이메일로 비밀번호 재설정 안내 메일을 발송했습니다. 메일함을 확인해주세요.'
      );
    } catch (err: any) {
      console.error('Forgot password error:', err);

      // 백엔드에서 보낸 에러 코드 확인
      const errorCode = err?.response?.data?.code;

      // 에러 코드에 따라 적절한 메시지를 state에 저장
      switch (errorCode) {
        case 'USER-001':
          setError('존재하지 않는 사용자입니다.');
          break;
        case 'COMMON-006':
          setError('이메일 형식이 올바르지 않습니다.');
          break;
        case 'USER-009':
          setError('메일 서버의 문제로 이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
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
        <h2 className="text-2xl font-semibold text-[#FFD93D] text-center mb-6">비밀번호 찾기</h2>

        {message ? (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700">{message}</p>
            <Link
              href="/auth/login"
              className="text-sm mt-4 text-[#FFD93D] font-bold hover:underline inline-block"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <p className="text-center text-sm mb-2">가입 시 사용한 이메일 주소를 입력하세요.</p>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-[20px] px-4 py-3 w-full text-sm"
              required
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#FFD93D] rounded-[20px] py-3 font-semibold text-[#666666] disabled:bg-gray-300"
            >
              {isLoading ? '전송 중...' : '확인'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
