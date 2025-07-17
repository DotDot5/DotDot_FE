export default function Header() {
  return (
    <header className="w-full h-16 bg-white flex justify-between items-center px-6 shadow">
      <div className="text-xl font-bold text-yellow-500">DotDot</div>
      <div className="flex items-center gap-4">
        <button className="relative">
          📩
          <span className="absolute top-0 right-0 bg-yellow-400 text-xs px-1 rounded-full">3</span>
        </button>
        <a href="/mypage" className="block">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-4xl text-gray-600 mr-4 overflow-hidden">
            👤
          </div>
        </a>
      </div>
    </header>
  );
}
