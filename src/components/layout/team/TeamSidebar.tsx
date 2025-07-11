'use client';

import { useState } from 'react';
import CreateTeamDialog from './CreateTeamDialog';
import RenameTeamDialog from './RenameTeamDialog';
import { Team } from '@/types/team';

export default function TeamSidebar() {
  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: 'DotDot' },
    { id: 2, name: '소공전' },
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleAddClick = () => setShowCreateDialog(true);
  const handleRenameClick = (team: Team) => {
    setEditingTeam(team);
    setOpenMenuId(null); // 메뉴 닫기
  };

  return (
    <div>
      {/* 상단 '팀' 제목 + + 버튼 */}
      <div className="flex items-center justify-between group cursor-pointer">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">👥 팀</div>
        <button
          onClick={handleAddClick}
          className="opacity-0 group-hover:opacity-100 text-[#FFD93D]"
        >
          +
        </button>
      </div>

      {/* 팀 리스트 */}
      <div className="ml-6 mt-2 flex flex-col gap-1">
        {teams.map((team) => (
          <div key={team.id} className="group relative" onMouseLeave={() => setOpenMenuId(null)}>
            <div className="flex justify-between items-center">
              <a className="text-sm text-black font-medium">{team.name}</a>

              {/* 햄버거 버튼: hover 시 보이도록 */}
              <button
                className="text-xs text-gray-500 opacity-0 group-hover:opacity-100"
                onClick={() => setOpenMenuId((prev) => (prev === team.id ? null : team.id))}
              >
                ⋮
              </button>
            </div>

            {/* 이름 바꾸기 메뉴: 클릭 시 보이도록 */}
            {openMenuId === team.id && (
              <div className="absolute right-0 mt-1 bg-white shadow p-1 text-sm rounded z-10">
                <button onClick={() => handleRenameClick(team)}>이름 바꾸기</button>
              </div>
            )}

            {/* 하위 링크 */}
            <div className="ml-4 text-xs text-gray-600">
              <a href="#">팀 페이지</a>
              <br />
              <a href="#">일정</a>
            </div>
          </div>
        ))}
      </div>

      {/* 새 팀 생성 다이얼로그 */}
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

      {/* 이름 변경 다이얼로그 */}
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
