'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserProfile } from '@/api/user';

export default function Header() {
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

  return (
    <header className="w-full h-16 bg-white flex justify-between items-center px-6 shadow">
      <div className="text-xl font-bold text-yellow-500">DotDot</div>
      <div className="flex items-center gap-4">
        {/* <button className="relative">
          📩
          <span className="absolute top-0 right-0 bg-yellow-400 text-xs px-1 rounded-full">3</span>
        </button> */}
        <Link href="/mypage" className="block">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              alt={(name || '프로필') + ' 이미지'}
              className="w-8 h-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            // fallback (이미지 없음)
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
              {name ? name.charAt(0).toUpperCase() : '👤'}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
