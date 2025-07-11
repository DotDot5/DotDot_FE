'use client';

import { useState } from 'react';
import { Team } from '@/types/team';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/internal/ui/dialog';

interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (newTeam: Team) => void;
}

export default function CreateTeamDialog({ open, onClose, onCreate }: CreateTeamDialogProps) {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;

    const newTeam: Team = {
      id: Date.now(),
      name,
    };
    onCreate(newTeam);
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-96">
        <DialogHeader>
          <DialogTitle>새 팀 만들기</DialogTitle>
        </DialogHeader>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded mb-4"
          placeholder="팀 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-gray-500">
            취소
          </button>
          <button onClick={handleCreate} className="bg-[#FFD93D] text-white px-4 py-2 rounded">
            생성
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
