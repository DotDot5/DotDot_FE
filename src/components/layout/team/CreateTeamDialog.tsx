'use client';

import { useState } from 'react';
import { Team } from '@/types/team';
import { createTeam } from '@/api/team'; // 경로는 실제 위치에 맞게 조정
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/internal/ui/dialog';

interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (newTeam: Team) => void;
}

export default function CreateTeamDialog({ open, onClose, onCreate }: CreateTeamDialogProps) {
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      const createdTeamId = await createTeam(name);
      const newTeam: Team = {
        id: createdTeamId,
        name,
      };
      onCreate(newTeam); // 부모에게 전달
      setName('');
      onClose(); // 모달 닫기
    } catch (error) {
      console.error('팀 생성 실패:', error);
      alert('팀 생성에 실패했어요. 다시 시도해주세요.');
    }
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
