// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { getUserProfile } from '@/api/user';

// export default function Header() {
//   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
//   const [name, setName] = useState<string>('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await getUserProfile();
//         const profile = (res?.data ?? res) as { profileImageUrl?: string; name?: string };
//         setAvatarUrl(profile?.profileImageUrl ?? null);
//         setName(profile?.name ?? '');
//       } catch (e) {
//         console.error('프로필 불러오기 실패:', e);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   return (
//     <header className="w-full h-16 bg-white flex justify-between items-center px-6 shadow">
//       <div className="text-xl font-bold text-yellow-500">DotDot</div>
//       <div className="flex items-center gap-4">
//         {/* <button className="relative">
//           📩
//           <span className="absolute top-0 right-0 bg-yellow-400 text-xs px-1 rounded-full">3</span>
//         </button> */}
//         <Link href="/mypage" className="block">
//           {loading ? (
//             <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
//           ) : avatarUrl ? (
//             <img
//               src={avatarUrl}
//               alt={(name || '프로필') + ' 이미지'}
//               className="w-8 h-8 rounded-full object-cover"
//               referrerPolicy="no-referrer"
//             />
//           ) : (
//             // fallback (이미지 없음)
//             <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
//               {name ? name.charAt(0).toUpperCase() : '👤'}
//             </div>
//           )}
//         </Link>
//       </div>
//     </header>
//   );
// }
// src/components/layout/Header.tsx (예시 경로)
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/api/user';
import { logout as apiLogout } from '@/api/auth';

export default function Header() {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserProfile();
        const profile = (res?.data ?? res) as { profileImageUrl?: string; name?: string };
        setAvatarUrl(profile?.profileImageUrl ?? null);
        setName(profile?.name ?? '');
      } catch (e) {
        console.error('프로필 불러오기 실패:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout(); // 서버 세션/리프레시토큰 무효화
    } catch (e) {
      console.error('로그아웃 API 실패:', e);
    } finally {
      // MyPage와 동일한 방식으로 토큰 정리
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } catch {}
      router.replace('/auth/login');
    }
  };

  return (
    <header className="w-full h-16 bg-white flex justify-between items-center px-6 shadow">
      <a href="/dashboard" className="text-xl font-bold text-yellow-500">
        DotDot
      </a>
      <div className="flex items-center gap-4">
        {/* 텍스트 링크들 */}
        <div className="hidden sm:flex items-center text-sm text-[#666]">
          <button
            onClick={handleLogout}
            className="hover:text-black hover:underline underline-offset-4"
          >
            로그아웃
          </button>
          <span className="mx-2 text-gray-300">|</span>
          <Link href="/mypage" className="hover:text-black hover:underline underline-offset-4">
            마이페이지
          </Link>
        </div>

        {/* 아바타 */}
        <Link href="/mypage" className="block">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${name || '프로필'} 이미지`}
              className="w-8 h-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setAvatarUrl(null)}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
              {name ? name.charAt(0).toUpperCase() : '👤'}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
