'use client';

import { useState } from 'react';
import { Team } from '@/types/team';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/internal/ui/dialog';

interface RenameTeamDialogProps {
  open: boolean;
  team: Team;
  onClose: () => void;
  onRename: (updatedTeam: Team) => void;
}

export default function RenameTeamDialog({ open, team, onClose, onRename }: RenameTeamDialogProps) {
  const [name, setName] = useState(team.name);

  const handleRename = () => {
    if (!name.trim()) return;

    onRename({ ...team, name });
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
