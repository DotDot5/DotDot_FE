'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/internal/ui/dialog';
import { Input } from '@/components/internal/ui/input';
import { Button } from '@/components/internal/ui/button';
import { CalendarIcon, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/internal/ui/popover';
import { Calendar } from '@/components/internal/ui/calendar';
import { TimePicker } from '@/components/internal/ui/timepicker';

export default function MeetingCreateModal({
  open,
  onClose,
  mode = 'create',
  existingMeeting,
}: {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  existingMeeting?: {
    title: string;
    date: Date;
    time: string;
    recordType: 'live' | 'upload';
    members: Array<{ name: string; role: string }>;
    agendaItems: Array<{ type: string; content: string; checked: boolean }>;
  };
}) {
  const [title, setTitle] = useState(existingMeeting?.title || '');
  const [date, setDate] = useState<Date | undefined>(existingMeeting?.date || new Date());
  const [time, setTime] = useState(existingMeeting?.time || '21:10');
  const [recordType, setRecordType] = useState<'live' | 'upload'>(
    existingMeeting?.recordType || 'upload'
  );
  const [members, setMembers] = useState(
    existingMeeting?.members || [
      { name: '고예린', role: '' },
      { name: '김다은', role: '' },
      { name: '김세현', role: '프론트' },
      { name: '정태윤', role: '백엔드' },
    ]
  );

  const [agenda, setAgenda] = useState('');
  const [agendaType, setAgendaType] = useState('백엔드 API 명세서');
  const [agendaItems, setAgendaItems] = useState(
    existingMeeting?.agendaItems || [{ type: '백엔드 API 명세서', content: '', checked: false }]
  );

  const [openRoleDropdown, setOpenRoleDropdown] = useState<number | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [roleOptions, setRoleOptions] = useState(['프론트', '백엔드', 'PM', '디자이너']);
  const [roleColors, setRoleColors] = useState<{ [key: string]: string }>({
    프론트: 'bg-blue-100 text-blue-600',
    백엔드: 'bg-red-100 text-red-500',
    PM: 'bg-purple-100 text-purple-600',
    디자이너: 'bg-pink-100 text-pink-600',
  });

  // 사용 가능한 색깔 리스트
  const availableColors = [
    // 'bg-blue-100 text-blue-600',
    // 'bg-red-100 text-red-600',
    // 'bg-purple-100 text-purple-600',
    // 'bg-pink-100 text-pink-600',
    'bg-green-100 text-green-600',
    'bg-yellow-100 text-yellow-600',
    'bg-indigo-100 text-indigo-600',
    'bg-orange-100 text-orange-600',
    'bg-teal-100 text-teal-600',
    'bg-cyan-100 text-cyan-600',
    'bg-lime-100 text-lime-600',
    'bg-rose-100 text-rose-600',
  ];

  const getRandomColor = () => {
    const usedColors = Object.values(roleColors);
    const unusedColors = availableColors.filter((color) => !usedColors.includes(color));

    if (unusedColors.length > 0) {
      return unusedColors[Math.floor(Math.random() * unusedColors.length)];
    } else {
      // 모든 색깔이 사용된 경우 랜덤으로 선택
      return availableColors[Math.floor(Math.random() * availableColors.length)];
    }
  };

  const getRoleColor = (role: string) => {
    return roleColors[role] || 'bg-gray-100 text-gray-600';
  };

  const addNewRole = () => {
    const trimmed = newRoleName.trim();
    if (trimmed && !roleOptions.includes(trimmed)) {
      setRoleOptions([...roleOptions, trimmed]);
      // 새 역할에 랜덤 색깔 지정
      const newColor = getRandomColor();
      setRoleColors((prev) => ({
        ...prev,
        [trimmed]: newColor,
      }));
    }
    setNewRoleName('');
    setIsAddingRole(false);
  };

  const handleRoleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addNewRole();
    if (e.key === 'Escape') {
      setIsAddingRole(false);
      setNewRoleName('');
    }
  };

  const updateMemberRole = (index: number, role: string) => {
    const updated = [...members];
    updated[index].role = role;
    setMembers(updated);
    setOpenRoleDropdown(null);
  };

  const addAgendaItem = () => {
    setAgendaItems([...agendaItems, { type: '', content: '', checked: false }]);
  };

  const updateAgendaItem = (index: number, field: 'type' | 'content', value: string) => {
    const updated = [...agendaItems];
    updated[index][field] = value;
    setAgendaItems(updated);
  };

  const toggleAgendaCheck = (index: number) => {
    const updated = [...agendaItems];
    updated[index].checked = !updated[index].checked;
    setAgendaItems(updated);
  };

  const removeAgendaItem = (index: number) => {
    if (agendaItems.length > 1) {
      const updated = agendaItems.filter((_, i) => i !== index);
      setAgendaItems(updated);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[600px] rounded-2xl px-10 py-8 bg-white relative">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#000000] mb-6">
            {mode === 'create' ? '새 회의 만들기' : '회의 수정하기'}
          </DialogTitle>
        </DialogHeader>

        {/* 회의 제목 */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-[#000000] block mb-2">회의 제목</label>
          <Input
            className="w-full border-gray-300 pr-10 text-[#000000]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="회의 제목을 입력하세요"
          />
        </div>

        {/* 날짜 & 시간 */}
        <div className="flex gap-6 mb-5">
          <div className="flex-1">
            <label className="text-sm font-semibold text-[#000000] block mb-2">회의 날짜</label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    readOnly
                    value={date?.toLocaleDateString() || ''}
                    className="w-full pr-10 border-gray-300 text-[#666666] cursor-pointer"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1">
            <label className="text-sm font-semibold text-[#000000] block mb-2">시간</label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    readOnly
                    value={time}
                    className="w-full pr-10 border-gray-300 text-[#666666] cursor-pointer"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <TimePicker value={time} onChange={setTime} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 회의 기록 방식 */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-[#000000] block mb-2">회의 기록 방식</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#000000]">
              <input
                type="radio"
                checked={recordType === 'live'}
                onChange={() => setRecordType('live')}
              />
              실시간 녹음
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-[#000000]">
              <input
                type="radio"
                checked={recordType === 'upload'}
                onChange={() => setRecordType('upload')}
              />
              파일 업로드
            </label>
          </div>
        </div>

        {/* 참석자 및 역할 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-[#000000]">참석자 및 역할</label>
            <div className="relative">
              <button
                onClick={() => setIsAddingRole(!isAddingRole)}
                className="text-sm text-[#000000] border border-gray-300 rounded-full px-3 py-0.5 hover:bg-gray-100"
              >
                역할 추가
              </button>
              {isAddingRole && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 w-[160px] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#000000] font-medium">새 역할</span>
                    <button
                      className="text-sm text-[#666666] hover:text-[#000000]"
                      onClick={() => {
                        setIsAddingRole(false);
                        setNewRoleName('');
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    onKeyDown={handleRoleInputKeyPress}
                    placeholder="새 역할 입력"
                    className="w-full h-7 text-xs px-2 text-[#000000]"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {/* 첫 번째 줄 */}
            <div className="flex gap-3">
              {members.slice(0, 2).map((member, i) => (
                <div
                  key={i}
                  className="flex-1 flex items-center justify-between px-4 py-2 bg-gray-100 rounded-full gap-2 relative"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                    <span className="text-sm text-[#000000] truncate">{member.name}</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenRoleDropdown(openRoleDropdown === i ? null : i)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-all flex-shrink-0 ${
                        member.role ? getRoleColor(member.role) : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {member.role || '역할'}
                    </button>
                    {openRoleDropdown === i && (
                      <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[100px]">
                        {roleOptions.map((role) => (
                          <button
                            key={role}
                            onClick={() => updateMemberRole(i, role)}
                            className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors"
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* 첫 번째 줄에 하나만 있을 경우 빈 공간 */}
              {members.slice(0, 2).length === 1 && <div className="flex-1"></div>}
            </div>

            {/* 두 번째 줄 */}
            {members.length > 2 && (
              <div className="flex gap-3">
                {members.slice(2, 4).map((member, i) => (
                  <div
                    key={i + 2}
                    className="flex-1 flex items-center justify-between px-4 py-2 bg-gray-100 rounded-full gap-2 relative"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-sm text-[#000000] truncate">{member.name}</span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenRoleDropdown(openRoleDropdown === i + 2 ? null : i + 2)
                        }
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-all flex-shrink-0 ${
                          member.role ? getRoleColor(member.role) : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {member.role || '역할'}
                      </button>
                      {openRoleDropdown === i + 2 && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[100px]">
                          {roleOptions.map((role) => (
                            <button
                              key={role}
                              onClick={() => updateMemberRole(i + 2, role)}
                              className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors"
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* 두 번째 줄에 하나만 있을 경우 빈 공간 */}
                {members.slice(2, 4).length === 1 && <div className="flex-1"></div>}
              </div>
            )}

            {/* 세 번째 줄 (5명 이상일 경우) */}
            {members.length > 4 && (
              <div className="flex gap-3">
                {members.slice(4, 6).map((member, i) => (
                  <div
                    key={i + 4}
                    className="flex-1 flex items-center justify-between px-4 py-2 bg-gray-100 rounded-full gap-2 relative"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-sm text-[#000000] truncate">{member.name}</span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenRoleDropdown(openRoleDropdown === i + 4 ? null : i + 4)
                        }
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-all flex-shrink-0 ${
                          member.role ? getRoleColor(member.role) : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {member.role || '역할'}
                      </button>
                      {openRoleDropdown === i + 4 && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[100px]">
                          {roleOptions.map((role) => (
                            <button
                              key={role}
                              onClick={() => updateMemberRole(i + 4, role)}
                              className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors"
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* 세 번째 줄에 하나만 있을 경우 빈 공간 */}
                {members.slice(4, 6).length === 1 && <div className="flex-1"></div>}
              </div>
            )}
          </div>
        </div>

        {/* 회의 안건 */}
        {/* <div className="mb-6">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-[#000000]">회의 안건</label>
            <button className="text-sm text-[#000000]">추가</button>
          </div>
          <select
            value={agendaType}
            onChange={(e) => setAgendaType(e.target.value)}
            className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 text-sm text-[#000000]"
          >
            <option value="백엔드 API 명세서">백엔드 API 명세서</option>
            <option value="UI 흐름도">UI 흐름도</option>
          </select>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder="안건에 대한 메모로 작성하세요"
            className="w-full mt-3 border border-gray-300 rounded-md px-3 py-2 text-sm text-[#000000]"
            rows={3}
          />
        </div> */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-[#000000]">회의 안건</label>
            <button
              onClick={addAgendaItem}
              className="text-sm text-[#000000] border border-gray-300 rounded-full px-3 py-0.5 hover:bg-gray-100"
            >
              추가
            </button>
          </div>

          <div className="border border-gray-300 rounded-2xl px-5 py-4">
            <div className="space-y-4">
              {agendaItems.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleAgendaCheck(index)}
                        className="mr-2 accent-black cursor-pointer"
                      />
                      <input
                        type="text"
                        value={item.type}
                        onChange={(e) => updateAgendaItem(index, 'type', e.target.value)}
                        className="text-sm text-[#000000] bg-transparent border-none outline-none font-medium"
                        placeholder="안건 제목"
                      />
                    </div>
                    {agendaItems.length > 1 && (
                      <button
                        onClick={() => removeAgendaItem(index)}
                        className="text-sm text-[#666666] hover:text-[#000000]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <textarea
                    value={item.content}
                    onChange={(e) => updateAgendaItem(index, 'content', e.target.value)}
                    placeholder="안건에 대한 메모를 작성하세요"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#666666] placeholder:text-[#CCCCCC] resize-none bg-gray-50"
                    rows={2}
                  />

                  {/* 안건 구분선 (마지막 안건이 아닐 경우) */}
                  {index < agendaItems.length - 1 && <hr className="my-4 border-gray-200" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-[#666666] border border-gray-300 hover:bg-gray-100"
          >
            취소
          </Button>
          <Button className="bg-[#FFD93D] hover:bg-yellow-400 text-white font-semibold px-6 py-2 text-sm">
            {mode === 'create' ? '회의 만들기' : '회의 수정하기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
