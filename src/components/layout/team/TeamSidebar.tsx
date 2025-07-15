// src/components/layout/team/teamsidebar.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CreateTeamDialog from '@/components/layout/team/CreateTeamDialog'; // Adjust path if necessary
import RenameTeamDialog from '@/components/layout/team/RenameTeamDialog'; // Adjust path if necessary
import { Team } from '@/types/team'; // Adjust path if necessary
import { getMyTeams } from '@/api/team'; // 

export default function TeamSidebar() {
  // const [teams, setTeams] = useState<Team[]>([
  //   { id: 1, name: 'DotDot' },
  //   { id: 2, name: '소공전' },
  // ]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleAddClick = () => setShowCreateDialog(true);
  const handleRenameClick = (team: Team) => {
    setEditingTeam(team);
    setOpenMenuId(null); // Close menu
  };
  useEffect(() => {
    const fetchTeams = async () => {
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
    };

    fetchTeams();
  }, []);


  return (
    <div>
      {/* Top 'Team' title + + button */}
      <div className="flex items-center justify-between group cursor-pointer">
        <div className="flex items-center gap-2 text-[#333333] font-semibold">👥 팀</div>
        <button
          onClick={handleAddClick}
          className="opacity-0 group-hover:opacity-100 text-[#FFD93D]"
        >
          +
        </button>
      </div>

      {/* Team list */}
      <div className="ml-6 mt-2 flex flex-col gap-1">
        {teams.map((team) => (
          <div key={team.id} className="group relative" onMouseLeave={() => setOpenMenuId(null)}>
            <div className="flex justify-between items-center">
              {/* This link should ideally go to a team-specific overview page */}
              <Link href={`/team/${team.id}`} className="text-md text-[#333333] font-medium">
                {team.name}
              </Link>

              {/* Hamburger button: show on hover */}
              <button
                className="text-xs text-[#666666] opacity-0 group-hover:opacity-100"
                onClick={() => setOpenMenuId((prev) => (prev === team.id ? null : team.id))}
              >
                ⋮
              </button>
            </div>

            {/* Rename menu: show on click */}
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

            {/* Sub-links */}
            <div className="ml-4 text-sm text-[#666666]">
              <Link href={`/team/${team.id}`} className="block hover:underline">
                팀 페이지
              </Link>
              <Link href={`/calendar/${team.id}`} className="block hover:underline">
                {' '}
                {/* 👈 Changed href */}
                일정
              </Link>
            </div>
          </div>
        ))}
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
