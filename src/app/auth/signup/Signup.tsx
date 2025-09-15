'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { signup, login, checkEmail } from '@/api/auth';
import TermsModal from '../../mypage/TermsModal';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      router.replace('/dashboard'); // 로그인 상태면 대시보드로 강제 이동
    }
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) => {
    // 8-20자 길이 체크
    if (password.length < 8 || password.length > 20) {
      return false;
    }

    // 영문, 숫자, 특수문자 각각 최소 1개씩 포함 체크
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasLetter && hasNumber && hasSpecial;
  };

  const handleEmailCheck = async () => {
    setEmailError('');
    setEmailChecked(true);
    if (!validateEmail(email)) {
      setEmailAvailable(null);
      setEmailError('유효한 이메일 형식이 아닙니다.');
      return;
    }

    try {
      const isDuplicate = await checkEmail(email);
      if (isDuplicate) {
        setEmailAvailable(false);
        setEmailError('이미 사용 중인 이메일입니다.');
      } else {
        setEmailAvailable(true);
        setEmailError('사용 가능한 이메일입니다.');
      }
    } catch (err) {
      console.error('checkEmail error:', err);
      setEmailAvailable(null);
      setEmailError('이메일 확인 중 오류가 발생했습니다.');
    }
  };

  const getFormErrors = () => {
    const errors: string[] = [];

    if (!emailChecked) {
      errors.push('이메일 중복 확인을 해주세요.');
    } else if (!validateEmail(email)) {
      errors.push('유효한 이메일 형식이 아닙니다.');
    } else if (emailAvailable !== true) {
      errors.push('사용할 수 없는 이메일입니다.');
    }

    if (!validatePassword(password)) {
      errors.push('영문, 숫자, 특수문자 각 1개씩 포함하여 8-20자여야 합니다.');
    }

    if (password !== confirmPassword) {
      errors.push('비밀번호가 일치하지 않습니다.');
    }

    if (!name.trim()) {
      errors.push('이름을 입력해주세요.');
    }

    if (!department.trim()) {
      errors.push('부서를 입력해주세요.');
    }
    if (!position.trim()) {
      errors.push('직책을 입력해주세요.');
    }

    if (!agree) {
      errors.push('약관에 동의해주세요.');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const formErrors = getFormErrors();
    if (formErrors.length > 0) {
      setError(formErrors[0]); // 첫 번째 에러만 표시
      return;
    }

    try {
      await signup({ name, email, password, position, department });
      const { accessToken, refreshToken } = await login({ email, password });

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      alert('회원가입이 완료되었습니다.');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorCode = err?.response?.data?.code;

      if (errorCode === 'USER-002') {
        setEmailError('이미 존재하는 이메일입니다.');
      } else if (errorCode === 'COMMON-006') {
        setError('입력값이 잘못되었습니다.');
      } else {
        setError('회원가입에 실패했습니다.');
      }
    }
  };

  return (
    <main className="h-screen bg-white text-[#666666] flex justify-center items-center overflow-hidden">
      <div className="w-full max-w-md px-6 py-4 flex flex-col justify-between h-[98vh]">
        <div>
          <h1 className="text-3xl font-bold text-[#FFD93D] text-center mb-5">DotDot</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
            {/* 이메일 */}
            <div>
              <label className="font-semibold text-xs">이메일</label>
              <div className="grid grid-cols-[1fr_auto] gap-2 mt-1">
                <input
                  type="email"
                  placeholder="이메일을 입력해주세요."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailAvailable(null);
                    setEmailChecked(false);
                    setEmailError('');
                  }}
                  className="border rounded-[20px] h-9 px-3 w-full text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={handleEmailCheck}
                  className={`px-2 rounded h-9 text-xs transition-colors duration-200 ${
                    emailAvailable === true
                      ? 'bg-green-200 text-green-800'
                      : emailAvailable === false
                        ? 'bg-red-200 text-red-800'
                        : 'bg-[#d9d9d9] text-black'
                  }`}
                >
                  중복확인
                </button>
              </div>
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="font-semibold text-xs">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="영문, 숫자, 특수문자 조합하여 8-20자"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border rounded-[20px] h-9 px-3 pr-8 w-full text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
            </div>

            {/* 비밀번호 확인 */}
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border rounded-[20px] h-9 px-3 pr-8 w-full text-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {confirmPasswordError && (
                <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
              )}
            </div>

            {/* 이름 */}
            <div>
              <label className="font-semibold text-xs">이름</label>
              <input
                type="text"
                placeholder="이름을 입력해주세요."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded-[20px] h-9 px-3 w-full text-xs"
                required
              />
            </div>

            {/* 부서 */}
            <div>
              <label className="font-semibold text-xs">부서</label>
              <input
                type="text"
                placeholder="부서를 입력해 주세요 ex)백엔드 개발팀"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="border rounded-[20px] h-9 px-3 w-full text-xs"
                required
              />
            </div>

            {/* 직책 */}
            <div>
              <label className="font-semibold text-xs">직책</label>
              <input
                type="text"
                placeholder="직책을 입력해 주세요 ex)개발팀장"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="border rounded-[20px] h-9 px-3 w-full text-xs"
                required
              />
            </div>

            {/* 약관 */}
            <div className="border rounded-[20px] h-9 px-3 flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={() => setAgree(!agree)}
                  className="mr-1 accent-black cursor-pointer scale-75"
                />
                <span className="text-xs">인증 약관 전체 동의</span>
              </label>
              {/* '보기' 버튼 클릭 시 모달 열기 */}
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="text-xs font-semibold hover:underline"
              >
                보기 ▼
              </button>
            </div>
            {/* 에러 메시지 */}
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

            {/* 폼 검증 에러 표시 */}
            {getFormErrors().length > 0 && !error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <ul className="text-red-600 text-xs space-y-1">
                  {getFormErrors().map((err, index) => (
                    <li key={index}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              className="bg-[#FFD93D] rounded-[20px] h-9 font-semibold text-[#666666] text-sm"
              disabled={
                !agree ||
                emailAvailable !== true ||
                !emailChecked ||
                !email ||
                !password ||
                !confirmPassword ||
                !name ||
                !department ||
                !position
              }
            >
              회원가입
            </button>
          </form>
        </div>

        {/* 로그인 이동 */}
        <div>
          <div className="w-full border-t border-gray-200 mt-0 mb-1" />
          <div className="text-xs text-center">
            이미 회원이신가요?{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-[#FFD93D] font-bold hover:underline"
            >
              로그인 하기
            </button>
          </div>
        </div>
      </div>
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        title="이용약관"
      />
    </main>
  );
}
