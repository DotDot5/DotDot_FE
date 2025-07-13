'use client';

import { useState } from 'react';
import { Team } from '@/types/team';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/internal/ui/dialog';
import { updateTeamName } from '@/api/team'; 
import { useQueryClient } from '@tanstack/react-query';


interface RenameTeamDialogProps {
  open: boolean;
  team: Team;
  onClose: () => void;
  onRename: (updatedTeam: Team) => void;
}

export default function RenameTeamDialog({ open, team, onClose, onRename }: RenameTeamDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(team.name);

  const handleRename = async () => {
    if (!name.trim()) return;

    try {
      await updateTeamName(team.id, name); //API 호출
      // queryClient.invalidateQueries({ queryKey: ['teamDetail', team.id] });
      const teamIdStr = String(team.id);

      queryClient.invalidateQueries({ queryKey: ['teamDetail', teamIdStr] });
      await queryClient.refetchQueries({ queryKey: ['teamDetail', teamIdStr] });
      queryClient.invalidateQueries({ queryKey: ['teamList'] });
      
      onRename({ ...team, name }); // 로컬 상태 반영
      onClose(); //다이얼로그 닫기
    } catch (error) {
      console.error('팀 이름 수정 실패:', error);
      // 필요 시 사용자 알림 로직 추가
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-96">
        <DialogHeader>
          <DialogTitle>팀 이름 수정</DialogTitle>
        </DialogHeader>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-gray-500">
            취소
          </button>
          <button onClick={handleRename} className="bg-[#FFD93D] text-white px-4 py-2 rounded">
            저장
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
