'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
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
          />

          {/* 비밀번호 입력 */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded-[20px] px-4 py-3 pr-10 w-full text-sm"
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

          {/* 링크 */}
          <div className="text-sm text-right text-[#666666]">
            아이디 찾기 | 비밀번호 찾기
          </div>

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
          <button className="text-[#FFD93D] font-bold">회원가입</button>
        </div>
      </div>
    </main>
  );
}
