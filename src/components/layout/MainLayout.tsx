// import Header from './Header';
// import Sidebar from './MenuBar';

// export default function MainLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="flex flex-col h-screen">
//       <Header />
//       <div className="flex flex-1">
//         <Sidebar />
//         {/* <main className="flex-1 p-6 bg-background">{children}</main> */}
//         <main className="flex-1 bg-background">{children}</main>
//       </div>
//     </div>
//   );
// }

// src/components/layout/MainLayout.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Sidebar from './MenuBar';
import { getUserProfile } from '@/api/user'; // 사용자 정보 조회 API

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await getUserProfile();
        setIsVerified(true);
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    };

    verifyToken();
  }, [router]);

  if (!isVerified) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {/* 간단한 로딩 스피너나 메시지 */}
        {/* <p>인증 정보를 확인 중입니다...</p> */}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
