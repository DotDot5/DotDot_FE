'use client';

import { useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';

export default function ForbiddenPage() {
  const router = useRouter();

  // 다른 레이아웃에 의존하지 않는 독립적인 페이지로 구성합니다.
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '32px',
          backgroundColor: 'white',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          borderRadius: '16px',
          maxWidth: '448px',
          width: '90%',
        }}
      >
        <TriangleAlert
          style={{
            margin: '0 auto',
            height: '64px',
            width: '64px',
            color: '#f59e0b',
            marginBottom: '24px',
          }}
        />
        <h1
          style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}
        >
          접근 권한 없음
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '32px', lineHeight: '1.6' }}>
          요청하신 페이지에 접근할 수 있는 권한이 없습니다.
          <br />팀 멤버가 맞는지 확인하시거나, 관리자에게 문의해주세요.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            backgroundColor: '#FFD93D',
            color: 'black',
            fontWeight: '600',
            padding: '12px 32px',
            fontSize: '16px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f4c715')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFD93D')}
        >
          대시보드로 돌아가기
        </button>
      </div>
    </div>
  );
}
