"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from 'react';
import { Button } from "@/components/internal/ui/button";
import { Card, CardContent } from "@/components/internal/ui/card";
import { Calendar, Mic, MessageSquare, Users, Play, ArrowRight } from "lucide-react";

function isValidAccessToken(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    if (!payload?.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (isValidAccessToken(accessToken)) {
      router.replace('/dashboard');
    }
  }, [router]);

  const goLogin = useCallback(() => router.push("/auth/login"), [router]);
  const goSignup = useCallback(() => router.push("/auth/signup"), [router]);

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-[#FFD93D]" />,
      title: '스마트 회의 관리',
      description: '회의 일정을 쉽게 관리하고 팀원들과 효율적으로 협업하세요.',
    },
    {
      icon: <Mic className="w-8 h-8 text-[#FFD93D]" />,
      title: '실시간 회의 녹음',
      description: '회의 내용을 자동으로 녹음하고 중요한 순간을 놓치지 마세요.',
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-[#FFD93D]" />,
      title: 'AI 어시스턴트',
      description: 'AI가 회의 내용을 분석하고 핵심 포인트를 정리해드립니다.',
    },
    {
      icon: <Users className="w-8 h-8 text-[#FFD93D]" />,
      title: '팀 협업',
      description: '팀원들과 실시간으로 소통하고 회의록을 공유하세요.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 bg-[#FFD93D] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">DotDot</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={goLogin}
                className="text-gray-600 hover:text-gray-900"
              >
                로그인
              </Button>
              {/* <Button onClick={goSignup} className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium">
                시작하기
              </Button> */}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-yellow-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            스마트한 회의 관리의
            <br />
            <span className="text-[#FFD93D]">새로운 시작</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            DotDot과 함께 팀 회의를 더 효율적으로 관리하고, AI 어시스턴트의 도움으로 중요한 내용을
            놓치지 마세요. 실시간 협업과 스마트한 회의록 관리를 경험해보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={goSignup}
              className="inline-flex items-center bg-[#FFD93D] hover:bg-[#f4c715] text-black font-medium px-8 py-3 text-lg"
            >
              시작하기
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">왜 DotDot을 선택해야 할까요?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              팀의 생산성을 높이는 강력한 기능들을 만나보세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">간단한 3단계로 시작하세요</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              복잡한 설정 없이 바로 사용할 수 있습니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFD93D] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">팀 생성 및 초대</h3>
              <p className="text-gray-600">
                회원가입 후 팀을 생성하고 동료들을 이메일로 초대하세요.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFD93D] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">회의 일정 관리</h3>
              <p className="text-gray-600">
                회의를 생성하고 안건을 정리하세요. 팀원들과 실시간 협업이 가능합니다.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFD93D] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI 분석 및 정리</h3>
              <p className="text-gray-600">
                회의 종료 후 AI가 자동으로 핵심 내용을 분석·정리합니다.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#FFD93D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">지금 바로 시작해보세요</h2>
          <p className="text-lg text-black mb-8 opacity-80">
            DotDot을 체험하고 팀의 회의 문화를 혁신하세요
          </p>
          <Button
            onClick={goSignup}
            className="bg-black hover:bg-gray-800 text-white font-medium px-8 py-3 text-lg"
          >
            시작하기
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-[#FFD93D] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold">D</span>
              </div>
              <span className="ml-3 text-xl font-bold">DotDot</span>
            </div>
            <div className="text-gray-400">© 2025 DotDot. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
