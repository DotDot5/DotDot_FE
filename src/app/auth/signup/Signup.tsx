'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    console.log('Signup:', { email, password, name, position });
  };

  return (
    <main className="h-screen bg-white text-[#666666] flex justify-center items-center">
      <div className="w-full max-w-md px-6 py-6 flex flex-col justify-between h-[90vh]">
        <div>
          <h1 className="text-4xl font-bold text-[#FFD93D] text-center mb-6">DotDot</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
            {/* 이메일 */}
            <div>
              <label className="font-semibold">이메일</label>
              <div className="grid grid-cols-[1fr_auto] gap-2 mt-1">
                <input
                  type="email"
                  placeholder="이메일을 입력해주세요."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border rounded-[20px] h-11 px-4 w-full"
                />
                <button type="button" className="bg-[#d9d9d9] px-3 rounded h-11">중복확인</button>
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="font-semibold">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="영문, 숫자, 특수문자 조합하여 8-20자"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border rounded-[20px] h-11 px-4 pr-10 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border rounded-[20px] h-11 px-4 pr-10 w-full"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirm ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>

            {/* 이름 */}
            <div>
              <label className="font-semibold">이름</label>
              <input
                type="text"
                placeholder="이름을 입력해주세요."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded-[20px] h-11 px-4 w-full"
              />
            </div>

            {/* 직책 */}
            <div>
              <label className="font-semibold">직책</label>
              <input
                type="text"
                placeholder="직책을 입력해 주세요 ex)개발팀장"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="border rounded-[20px] h-11 px-4 w-full"
              />
            </div>

            {/* 약관 */}
            <div className="border rounded-[20px] h-11 px-4 flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={() => setAgree(!agree)}
                />
                인증 약관 전체 동의
              </label>
              <span className="text-xs">보기 ▼</span>
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              className="bg-[#FFD93D] rounded-[20px] h-11 font-semibold text-[#666666] mt-1"
              disabled={!agree}
            >
              회원가입
            </button>
          </form>
        </div>

        {/* 로그인 이동 */}
        <div>
          <div className="w-full border-t border-gray-200 mt-6 mb-3" />
          <div className="text-sm text-center">
            이미 회원이신가요?{' '}
            <button className="text-[#FFD93D] font-bold">로그인 하기</button>
          </div>
        </div>
      </div>
    </main>
  );
}
