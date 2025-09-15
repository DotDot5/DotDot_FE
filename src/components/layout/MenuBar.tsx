import Link from 'next/link';
import TeamSidebar from './team/TeamSidebar';
import { Home, Users } from 'lucide-react';

export default function MenuBar() {
  return (
    <aside className="w-60 h-full bg-white shadow-md p-4 z-8">
      <nav className="flex flex-col">
        {/* 홈 */}
        {/* <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-800 font-semibold leading-7 py-1.5"
        >
          🏠 홈
        </Link> */}
        <a
          href="/dashboard"
          className="flex items-center gap-2 text-gray-800 font-semibold leading-7 py-1.5"
        >
          <Home size={18} className="text-gray-600" /> 홈
        </a>

        <div className="border-t border-gray-200 mt-1 mb-2" />

        {/* 팀 사이드바 */}
        <TeamSidebar />
      </nav>
    </aside>
  );
}
