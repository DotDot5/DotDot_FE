const navItems = [
  { name: '홈', href: '/', icon: '🏠' },
  {
    name: '팀',
    href: '/team',
    icon: '👥',
    // subItems 배열의 각 객체에 name과 href 속성을 추가합니다.
    subItems: [
      { name: 'DotDot', href: '#' },
      { name: '팀 페이지', href: '#' },
      { name: '일정', href: '/calendar' }, // <--- '일정' 항목에 '/calendar' href 추가
      { name: '소공전', href: '#' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-60 h-full bg-white shadow-md p-4">
      <nav className="flex flex-col gap-4">
        {navItems.map((item) => (
          <div key={item.name}>
            <a href={item.href} className="flex items-center gap-2 text-gray-800 font-semibold">
              <span>{item.icon}</span> {item.name}
            </a>
            {item.subItems &&
              item.subItems.map((sub) => (
                <a
                  key={sub.name}
                  href={sub.href}
                  className="ml-6 mt-1 block text-gray-600 text-sm hover:text-yellow-500"
                >
                  {sub.name}
                </a>
              ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
