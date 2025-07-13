import TeamSidebar from './team/TeamSidebar';

export default function MenuBar() {
  return (
    <aside className="w-60 h-full bg-white shadow-md p-4">
      <nav className="flex flex-col gap-4">
        <a href="/" className="flex items-center gap-2 text-gray-800 font-semibold">
          🏠 홈
        </a>
        <TeamSidebar />
      </nav>
    </aside>
  );
}
