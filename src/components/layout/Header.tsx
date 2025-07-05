export default function Header() {
  return (
    <header className="w-full h-16 bg-white flex justify-between items-center px-6 shadow">
      <div className="text-xl font-bold text-yellow-500">DotDot</div>
      <div className="flex items-center gap-4">
        <button className="relative">
          📩
          <span className="absolute top-0 right-0 bg-yellow-400 text-xs px-1 rounded-full">3</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
          사용자
        </div>
      </div>
    </header>
  );
}
