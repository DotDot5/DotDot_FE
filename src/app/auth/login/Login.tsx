'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '@/api/auth';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      router.replace('/dashboard'); // 로그인 상태면 대시보드로 강제 이동
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { accessToken, refreshToken } = await login({ email, password });

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);

      const errorCode = err?.response?.data?.code;

      switch (errorCode) {
        case 'USER-004':
          setError('이메일 또는 비밀번호가 일치하지 않습니다.');
          break;
        case 'USER-001':
          setError('존재하지 않는 회원입니다.');
          break;
        case 'COMMON-006':
          setError('입력값이 잘못되었습니다.');
          break;
        default:
          setError('알 수 없는 오류가 발생했습니다.');
          break;
      }
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#666666] flex items-center justify-center">
      <div className="p-10 w-full max-w-md">
        <h1 className="text-4xl font-bold text-[#FFD93D] text-center mb-8">DotDot</h1>
        <h2 className="text-2xl font-semibold text-[#FFD93D] text-center mb-6">Login</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* 이메일 입력 */}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-[20px] px-4 py-3 w-full text-sm"
            required
          />

          {/* 비밀번호 입력 */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded-[20px] px-4 py-3 pr-10 w-full text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* 링크 */}
          <div className="text-sm text-right text-[#666666]">아이디 찾기 | 비밀번호 찾기</div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="bg-[#FFD93D] rounded-[20px] py-3 font-semibold text-[#666666]"
          >
            로그인
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div className="text-sm mt-6 text-center">
          아직 DotDot의 회원이 아닌가요?{' '}
          <button
            onClick={() => router.push('/auth/signup')}
            className="text-[#FFD93D] font-bold hover:underline"
          >
            회원가입
          </button>
        </div>
      </div>
    </main>
  );
}
