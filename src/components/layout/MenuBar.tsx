import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TeamSidebar from './team/TeamSidebar';
import { Home, Users, Plus } from 'lucide-react';
import { useState } from 'react';

export default function MenuBar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-60 h-full bg-white shadow-md border-r border-gray-200 z-8">
      <nav className="flex flex-col p-4 h-full">
        <div className="space-y-1 mb-6">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group ${
              isActive('/dashboard')
                ? 'bg-[#FFD93D] text-black shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Home
              size={18}
              className={`transition-transform duration-200 ${
                isActive('/dashboard') ? 'text-black' : 'text-gray-500 group-hover:text-gray-700'
              }`}
            />
            홈
            {isActive('/dashboard') && (
              <div className="ml-auto w-2 h-2 bg-black rounded-full animate-pulse"></div>
            )}
          </Link>
        </div>

        <div className="border-t border-gray-200 my-2" />

        {/* 팀 사이드바 */}
        <div className="flex-1 overflow-y-auto">
          <TeamSidebar />
        </div>
      </nav>
    </aside>
  );
}
