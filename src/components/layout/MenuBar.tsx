// const navItems = [
//   { name: '홈', href: '/', icon: '🏠' },
//   { name: '팀', href: '/team', icon: '👥', subItems: ['DotDot', '팀 페이지', '일정', '소공전'] },
// ];

// export default function Sidebar() {
//   return (
//     <aside className="w-60 h-full bg-white shadow-md p-4">
//       <nav className="flex flex-col gap-4">
//         {navItems.map((item) => (
//           <div key={item.name}>
//             <a href={item.href} className="flex items-center gap-2 text-gray-800 font-semibold">
//               <span>{item.icon}</span> {item.name}
//             </a>
//             {item.subItems &&
//               item.subItems.map((sub) => (
//                 <a
//                   key={sub}
//                   href="#"
//                   className="ml-6 mt-1 block text-gray-600 text-sm hover:text-yellow-500"
//                 >
//                   {sub}
//                 </a>
//               ))}
//           </div>
//         ))}
//       </nav>
//     </aside>
//   );
// }
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
