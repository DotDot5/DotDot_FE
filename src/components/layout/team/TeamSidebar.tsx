'use client';
import { Home, Users } from 'lucide-react';

import { useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreateTeamDialog from '@/components/layout/team/CreateTeamDialog';
import RenameTeamDialog from '@/components/layout/team/RenameTeamDialog';
import { Team } from '@/types/team';
import { getMyTeams } from '@/api/team';

const EXPANDED_KEY = 'teamSidebarExpanded';

export default function TeamSidebar() {
  const pathname = usePathname();

  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // 하위 메뉴(팀 페이지/일정) 펼침 상태
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const handleAddClick = () => setShowCreateDialog(true);
  const handleRenameClick = (team: Team) => {
    setEditingTeam(team);
    setOpenMenuId(null);
  };

  const toggleTeam = (teamId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      // 변경 즉시 저장
      try {
        localStorage.setItem(EXPANDED_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // 팀 목록 로드 (초기 1회)
  useLayoutEffect(() => {
    (async () => {
      try {
        const data = await getMyTeams();
        const mapped = data.map((t: { teamId: number; teamName: string }) => ({
          id: t.teamId,
          name: t.teamName,
        }));
        setTeams(mapped);
      } catch (e) {
        console.error('팀 목록 로딩 실패:', e);
      }
    })();
  }, []);

  // 초기 렌더 전에 펼침 상태 복원(깜빡임 방지)
  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(EXPANDED_KEY);
      if (raw) {
        const ids: number[] = JSON.parse(raw);
        setExpanded(new Set(ids));
      }
    } catch {}
  }, []);

  // (선택) 팀 목록이 바뀌었을 때 존재하지 않는 id만 정리. 사용자 상태는 유지.
  useLayoutEffect(() => {
    if (!teams.length) return;
    setExpanded((prev) => {
      const valid = new Set(teams.map((t) => t.id));
      const next = new Set<number>();
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id);
      });
      if (next.size !== prev.size) {
        try {
          localStorage.setItem(EXPANDED_KEY, JSON.stringify(Array.from(next)));
        } catch {}
      }
      return next;
    });
  }, [teams]);

  // 경로에 따라 링크 활성 표시 (스타일만)
  const activeClass = (href: string) =>
    pathname === href ? 'bg-gray-100 text-gray-900 rounded px-2' : 'text-[#666666] hover:underline';

  // 팀 페이지/일정 경로
  const paths = useMemo(
    () =>
      Object.fromEntries(
        teams.map((t) => [t.id, { team: `/team/${t.id}`, calendar: `/calendar/${t.id}` }])
      ),
    [teams]
  );

  return (
    <div className="leading-7">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        {/* 팀 로고 생각하기 */}
        {/* <div className="flex items-center gap-2 text-[#333333] font-semibold">👥 팀</div> */}
        <div className="flex items-center gap-2 text-[#333333] font-semibold">
          <Users size={18} className="text-gray-600" /> 팀
        </div>
        <button
          onClick={handleAddClick}
          className="text-[#FFD93D] rounded hover:bg-yellow-50 px-2 py-0.5"
          aria-label="팀 추가"
        >
          +
        </button>
      </div>

      {/* 리스트 */}
      <div className="mt-2 flex flex-col">
        {teams.map((team) => {
          const isExpanded = expanded.has(team.id);
          const teamHref = paths[team.id]?.team ?? `/team/${team.id}`;
          const calendarHref = paths[team.id]?.calendar ?? `/calendar/${team.id}`;

          return (
            <div key={team.id} className="group relative" onMouseLeave={() => setOpenMenuId(null)}>
              {/* 팀 행 */}
              <div className="flex justify-between items-center pr-1 py-1.5">
                <span className="text-md text-[#333333] font-medium select-none">{team.name}</span>

                {/* 오른쪽: 더보기 ⋮ + 토글 화살표 > */}
                <div className="flex items-center gap-1">
                  <button
                    className="text-xs text-[#666666] opacity-0 group-hover:opacity-100 px-1"
                    onClick={() => setOpenMenuId((prev) => (prev === team.id ? null : team.id))}
                    aria-label="팀 메뉴"
                  >
                    ⋮
                  </button>

                  {/* 얇은 chevron(>) 아이콘, 펼치면 아래로 회전 */}
                  <button
                    type="button"
                    onClick={() => toggleTeam(team.id)}
                    className="p-1 rounded hover:bg-gray-50"
                    aria-label={isExpanded ? '접기' : '펼치기'}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 더보기 메뉴 */}
              {openMenuId === team.id && (
                <div className="absolute right-0 mt-1 bg-white shadow p-1 text-sm rounded z-10">
                  <button
                    onClick={() => handleRenameClick(team)}
                    className="block w-full text-left px-2 py-1 hover:bg-gray-100"
                  >
                    이름 바꾸기
                  </button>
                </div>
              )}

              {/* 하위 링크 (토글) */}
              {isExpanded && (
                <div className="ml-6 mb-2 space-y-1">
                  <Link href={teamHref} className={`block text-sm py-1 ${activeClass(teamHref)}`}>
                    팀 페이지
                  </Link>
                  <Link
                    href={calendarHref}
                    className={`block text-sm py-1 ${activeClass(calendarHref)}`}
                  >
                    일정
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Team Dialog */}
      {showCreateDialog && (
        <CreateTeamDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreate={(newTeam: Team) => {
            setTeams((prev) => [...prev, newTeam]);
            setShowCreateDialog(false);
          }}
        />
      )}

      {/* Rename Team Dialog */}
      {editingTeam && (
        <RenameTeamDialog
          open={!!editingTeam}
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onRename={(updatedTeam: Team) => {
            setTeams((prev) => prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
            setEditingTeam(null);
          }}
        />
      )}
    </div>
  );
}
