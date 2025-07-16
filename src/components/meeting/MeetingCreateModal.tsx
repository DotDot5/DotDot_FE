'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/internal/ui/dialog';
import { Input } from '@/components/internal/ui/input';
import { Button } from '@/components/internal/ui/button';
import { CalendarIcon, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/internal/ui/popover';
import { Calendar } from '@/components/internal/ui/calendar';
import { TimePicker } from '@/components/internal/ui/timepicker';
import { getTeamMembers } from '@/api/team';
import { createMeeting, updateMeetingDetail } from '@/api/meeting';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function MeetingCreateModal({
  open,
  onClose,
  mode = 'create',
  existingMeeting,
  teamId: propTeamId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  teamId?: string;
  onSuccess?: () => void; // 성공 시 호출될 콜백
  existingMeeting?: {
    teamId?: string;
    title: string;
    date: Date;
    time: string;
    recordType: 'RECORD' | 'REALTIME';
    members: Array<{ userId?: number; name: string; role: string }>;
    agendaItems: Array<{ type: string; content: string }>;
  };
}) {
  const params = useParams();
  const meetingId = params.id as string; // 이건 회의 ID

  // create 모드에서는 prop으로 전달된 teamId 사용, edit 모드에서는 기존 회의의 teamId 사용
  const currentTeamId =
    mode === 'edit' && existingMeeting?.teamId ? existingMeeting.teamId : propTeamId;

  console.log(
    'MeetingCreateModal - mode:',
    mode,
    'currentTeamId:',
    currentTeamId,
    'existingMeeting:',
    existingMeeting
  );

  const [title, setTitle] = useState(existingMeeting?.title || '');
  const [date, setDate] = useState<Date | undefined>(existingMeeting?.date || new Date());
  const [time, setTime] = useState(
    existingMeeting?.time ||
      new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
  );
  const [recordType, setRecordType] = useState<'REALTIME' | 'RECORD'>(
    existingMeeting?.recordType === 'REALTIME' ? 'REALTIME' : 'REALTIME'
  );

  // 팀원 관련 상태
  const [teamMembers, setTeamMembers] = useState<
    Array<{ userId: number; name: string; role: string }>
  >([]);
  const [selectedMembers, setSelectedMembers] = useState<
    Array<{ userId: number; name: string; role: string }>
  >([]);
  const [showMemberSelector, setShowMemberSelector] = useState(false);

  // 기존 members 상태를 selectedMembers로 대체
  const [members, setMembers] = useState<Array<{ userId: number; name: string; role: string }>>([]);

  const [agenda, setAgenda] = useState('');
  const [agendaType, setAgendaType] = useState('백엔드 API 명세서');
  const [agendaItems, setAgendaItems] = useState<Array<{ type: string; content: string }>>(
    existingMeeting?.agendaItems && existingMeeting.agendaItems.length > 0
      ? existingMeeting.agendaItems
      : [{ type: '', content: '' }]
  );

  const [openRoleDropdown, setOpenRoleDropdown] = useState<number | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isEditModeInitialized, setIsEditModeInitialized] = useState(false);

  // 기존 회의 데이터에서 역할 추출하여 초기화
  const getInitialRoleOptions = () => {
    if (existingMeeting?.members) {
      const uniqueRoles = [
        ...new Set(existingMeeting.members.map((m) => m.role).filter((role) => role)),
      ];
      return uniqueRoles.length > 0 ? uniqueRoles : ['참석자'];
    }
    return ['참석자'];
  };

  const [roleOptions, setRoleOptions] = useState(getInitialRoleOptions());

  // 팀원 데이터 가져오기
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (currentTeamId) {
        try {
          const data = await getTeamMembers(currentTeamId);
          setTeamMembers(data);
        } catch (error) {
          console.error('팀원 정보 가져오기 실패:', error);
          toast.error('팀원 정보를 불러오는데 실패했습니다.');
        }
      }
    };
    fetchTeamMembers();
  }, [currentTeamId]);

  // members 상태를 selectedMembers와 동기화
  useEffect(() => {
    if (
      mode === 'edit' &&
      existingMeeting?.members &&
      teamMembers.length > 0 &&
      !isEditModeInitialized
    ) {
      // 편집 모드에서는 팀원 데이터가 로드된 후에 실제 userId를 찾아서 설정 (한 번만)
      const editMembers = existingMeeting.members.map((m) => {
        const teamMember = teamMembers.find((tm) => tm.name === m.name);
        return {
          userId: m.userId || teamMember?.userId || 0,
          name: m.name,
          role: m.role,
        };
      });
      setMembers(editMembers);
      setSelectedMembers(editMembers);
      setIsEditModeInitialized(true);
      console.log('Edit mode initialized with members:', editMembers);
    } else if (mode === 'create' && !isEditModeInitialized) {
      // 생성 모드에서는 selectedMembers와 동기화
      setMembers(selectedMembers);
    }
  }, [mode, existingMeeting, teamMembers, selectedMembers, isEditModeInitialized]);

  // 모달이 열릴 때마다 초기화 플래그 리셋 및 상태 초기화
  useEffect(() => {
    if (open) {
      setIsEditModeInitialized(false);

      // 모드에 따른 초기화
      if (mode === 'create') {
        // 생성 모드: 모든 상태 초기화
        setTitle('');
        setDate(new Date());
        setTime(
          new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        );
        setRecordType('REALTIME');
        setMembers([]);
        setSelectedMembers([]);
        setAgendaItems([{ type: '', content: '' }]);
        setRoleOptions(['참석자']);
      } else if (mode === 'edit' && existingMeeting) {
        // 편집 모드: 기존 데이터로 초기화
        setTitle(existingMeeting.title);
        setDate(existingMeeting.date);
        setTime(existingMeeting.time);
        setRecordType(existingMeeting.recordType);
        setAgendaItems(
          existingMeeting.agendaItems && existingMeeting.agendaItems.length > 0
            ? existingMeeting.agendaItems
            : [{ type: '', content: '' }]
        );

        // 기존 회의의 역할들로 roleOptions 초기화
        const existingRoles =
          existingMeeting.members?.map((m) => m.role).filter((role) => role) || [];
        const uniqueRoles = [...new Set(existingRoles)];
        setRoleOptions(uniqueRoles.length > 0 ? uniqueRoles : ['참석자']);
      }
    }
  }, [open, mode, existingMeeting]);

  // 팀원 선택/해제
  const toggleMemberSelection = (member: { userId: number; name: string; role: string }) => {
    const isSelected = members.some((m) => m.userId === member.userId);

    if (isSelected) {
      // 제거 - userId가 일치하는 멤버 제거
      const updatedMembers = members.filter((m) => m.userId !== member.userId);
      setMembers(updatedMembers);
      setSelectedMembers(updatedMembers);
    } else {
      // 추가 - 기본 역할은 기존 팀원 역할 또는 '참석자'로 설정
      const newMember = {
        userId: member.userId,
        name: member.name,
        role: member.role || '참석자',
      };
      const updatedMembers = [...members, newMember];
      setMembers(updatedMembers);
      setSelectedMembers(updatedMembers);
    }

    console.log('Member selection toggled:', member.name, 'isSelected:', isSelected);
  };

  // view 페이지와 동일한 색깔 배정 로직
  const getRoleColor = (role: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-red-100 text-red-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-yellow-100 text-yellow-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-orange-100 text-orange-600',
    ];

    // roleOptions를 기준으로 색깔 배정
    const roleIndex = roleOptions.indexOf(role);

    return roleIndex !== -1 && roleIndex < colors.length
      ? colors[roleIndex]
      : 'bg-gray-200 text-gray-500';
  };

  const addNewRole = () => {
    const trimmed = newRoleName.trim();
    if (trimmed && !roleOptions.includes(trimmed)) {
      setRoleOptions([...roleOptions, trimmed]);
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

    // 모든 모드에서 selectedMembers 동기화
    setSelectedMembers(updated);

    setOpenRoleDropdown(null);
    console.log('Member role updated:', updated[index].name, 'to', role);
  };

  const removeMember = (index: number) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
    setSelectedMembers(updated);
  };

  const addAgendaItem = () => {
    // 마지막 안건이 비어있지 않을 때만 새로운 안건 추가 (단, 안건이 0개일 때는 항상 추가)
    if (agendaItems.length === 0) {
      setAgendaItems([{ type: '', content: '' }]);
      return;
    }

    const lastAgenda = agendaItems[agendaItems.length - 1];
    if (lastAgenda && lastAgenda.type.trim() !== '' && lastAgenda.content.trim() !== '') {
      setAgendaItems([...agendaItems, { type: '', content: '' }]);
    } else if (
      agendaItems.length === 1 &&
      lastAgenda.type.trim() === '' &&
      lastAgenda.content.trim() === ''
    ) {
      // 첫 번째 안건이 비어있을 때도 추가 가능
      setAgendaItems([...agendaItems, { type: '', content: '' }]);
    }
  };

  const updateAgendaItem = (index: number, field: 'type' | 'content', value: string) => {
    const updated = [...agendaItems];
    updated[index][field] = value;
    setAgendaItems(updated);
  };

  const removeAgendaItem = (index: number) => {
    if (agendaItems.length > 1) {
      const updated = agendaItems.filter((_, i) => i !== index);
      setAgendaItems(updated);
    }
  };

  // 빈 안건 필터링 함수
  const filterValidAgendaItems = () => {
    return agendaItems.filter((item) => item.type.trim() !== '' || item.content.trim() !== '');
  };

  // 회의 수정 함수
  const handleUpdateMeeting = async () => {
    try {
      // 필수 필드 검증
      if (!currentTeamId) {
        toast.error('팀 정보가 없습니다.');
        return;
      }

      if (!title.trim()) {
        toast.error('회의 제목을 입력해주세요.');
        return;
      }

      if (!date) {
        toast.error('회의 날짜를 선택해주세요.');
        return;
      }

      if (members.length === 0) {
        toast.error('참석자를 선택해주세요.');
        return;
      }

      if (!meetingId) {
        toast.error('회의 ID가 없습니다.');
        return;
      }

      // 빈 안건 제거
      const validAgendaItems = filterValidAgendaItems();

      // 날짜와 시간을 합쳐서 ISO 문자열 생성
      const [hours, minutes] = time.split(':');
      const meetingDateTime = new Date(date);
      meetingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const meetingData = {
        teamId: parseInt(currentTeamId || '0'),
        title: title.trim(),
        meetingAt: meetingDateTime.toISOString(),
        meetingMethod: recordType,
        note: '',
        participants: members.map((member) => ({
          userId: member.userId || 0, // userId가 0이면 기본값 사용
          part: member.role || '참석자',
          speakerIndex: 0,
          userName: member.name || '',
        })),
        agendas: validAgendaItems.map((item) => ({
          agenda: item.type,
          body: item.content,
        })),
      };

      await updateMeetingDetail(parseInt(meetingId), meetingData);
      toast.success('회의가 성공적으로 수정되었습니다.');
      onClose();
      // 성공 콜백 호출 (부모에서 데이터 갱신)
      onSuccess?.();
    } catch (error) {
      console.error('회의 수정 실패:', error);
      toast.error('회의 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };
  const handleCreateMeeting = async () => {
    try {
      // 필수 필드 검증
      if (!currentTeamId) {
        toast.error('팀 정보가 없습니다.');
        return;
      }

      if (!title.trim()) {
        toast.error('회의 제목을 입력해주세요.');
        return;
      }

      if (!date) {
        toast.error('회의 날짜를 선택해주세요.');
        return;
      }

      if (members.length === 0) {
        toast.error('참석자를 선택해주세요.');
        return;
      }

      // 빈 안건 제거
      const validAgendaItems = filterValidAgendaItems();

      // 날짜와 시간을 합쳐서 ISO 문자열 생성
      const [hours, minutes] = time.split(':');
      const meetingDateTime = new Date(date);
      meetingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const meetingData = {
        teamId: parseInt(currentTeamId || '0'),
        title: title.trim(),
        meetingAt: meetingDateTime.toISOString(),
        meetingMethod: recordType,
        note: '',
        participants: members.map((member) => ({
          userId: member.userId || 0, // userId가 0이면 기본값 사용
          part: member.role || '참석자',
          speakerIndex: 0,
          memberName: member.name || '',
        })),
        agendas: validAgendaItems.map((item) => ({
          agenda: item.type,
          body: item.content,
        })),
      };

      await createMeeting(meetingData);
      toast.success('회의가 성공적으로 생성되었습니다.');
      onClose();
      // 성공 콜백 호출 (부모에서 데이터 갱신)
      onSuccess?.();
    } catch (error) {
      console.error('회의 생성 실패:', error);
      toast.error('회의 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[550px] max-h-[80vh] rounded-2xl px-8 py-6 bg-white relative overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-[#000000] mb-4">
            {mode === 'create' ? '새 회의 만들기' : '회의 수정하기'}
          </DialogTitle>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent'
          }}
        >
        {/* 회의 제목 */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-[#000000] block mb-2">회의 제목</label>
          <Input
            className="w-full border-gray-300 pr-10 text-[#000000]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="회의 제목을 입력하세요"
          />
        </div>

        {/* 날짜 & 시간 */}
        <div className="flex gap-4 mb-4">
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
        <div className="mb-4">
          <label className="text-sm font-semibold text-[#000000] block mb-2">회의 기록 방식</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#000000]">
              <input
                type="radio"
                checked={recordType === 'REALTIME'}
                onChange={() => setRecordType('REALTIME')}
              />
              실시간 녹음
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-[#000000]">
              <input
                type="radio"
                checked={recordType === 'RECORD'}
                onChange={() => setRecordType('RECORD')}
              />
              파일 업로드
            </label>
          </div>
        </div>

        {/* 참석자 및 역할 */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-[#000000]">참석자 및 역할</label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMemberSelector(!showMemberSelector)}
                className="text-sm text-[#000000] border border-gray-300 rounded-full px-3 py-0.5 hover:bg-gray-100"
              >
                팀원 선택
              </button>
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
          </div>

          {/* 팀원 선택 드롭다운 */}
          {showMemberSelector && (
            <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="text-xs text-[#666666] mb-2">팀원을 선택하세요:</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {teamMembers.length === 0 ? (
                  <div className="text-sm text-[#666666]">팀원 정보를 불러오는 중...</div>
                ) : (
                  teamMembers.map((member) => {
                    const isSelected = members.some((m) => m.userId === member.userId);
                    return (
                      <label
                        key={member.userId}
                        className="flex items-center gap-2 cursor-pointer w-full"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMemberSelection(member)}
                          className="accent-black flex-shrink-0"
                        />
                        <span className="text-sm text-[#000000] flex-1 min-w-0 truncate">
                          {member.name}
                        </span>
                        {member.role && (
                          <span className="text-xs text-[#666666] bg-gray-200 px-2 py-0.5 rounded-full flex-shrink-0">
                            {member.role}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 선택된 참석자 표시 */}
          {members.length > 0 && (
            <div className="mt-3 space-y-3">
              {/* 첫 번째 줄 */}
              <div className="flex gap-3">
                {members.slice(0, 2).map((member, i) => (
                  <div
                    key={i}
                    className="w-[calc(50%-6px)] flex items-center justify-between px-4 py-2 bg-gray-100 rounded-full gap-2 relative"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-sm text-[#000000] truncate">{member.name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="relative">
                        <button
                          onClick={() => setOpenRoleDropdown(openRoleDropdown === i ? null : i)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-all flex-shrink-0 max-w-[80px] truncate ${
                            member.role ? getRoleColor(member.role) : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {member.role || '참석자'}
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
                      <button
                        onClick={() => removeMember(i)}
                        className="text-xs text-[#666666] hover:text-red-500 w-4 h-4 flex items-center justify-center"
                        title="참석자 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {/* 첫 번째 줄에 하나만 있을 경우 빈 공간 */}
                {members.slice(0, 2).length === 1 && <div className="w-[calc(50%-6px)]"></div>}
              </div>

              {/* 두 번째 줄 */}
              {members.length > 2 && (
                <div className="flex gap-3">
                  {members.slice(2, 4).map((member, i) => (
                    <div
                      key={i + 2}
                      className="w-[calc(50%-6px)] flex items-center justify-between px-4 py-2 bg-gray-100 rounded-full gap-2 relative"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="text-sm text-[#000000] truncate">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenRoleDropdown(openRoleDropdown === i + 2 ? null : i + 2)
                            }
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-all flex-shrink-0 max-w-[80px] truncate ${
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
                        <button
                          onClick={() => removeMember(i + 2)}
                          className="text-xs text-[#666666] hover:text-red-500 w-4 h-4 flex items-center justify-center"
                          title="참석자 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* 두 번째 줄에 하나만 있을 경우 빈 공간 */}
                  {members.slice(2, 4).length === 1 && <div className="w-[calc(50%-6px)]"></div>}
                </div>
              )}

              {/* 세 번째 줄 (5명 이상일 경우) */}
              {members.length > 4 && (
                <div className="flex gap-3">
                  {members.slice(4, 6).map((member, i) => (
                    <div
                      key={i + 4}
                      className="w-[calc(50%-6px)] flex items-center justify-between px-4 py-2 bg-gray-100 rounded-full gap-2 relative"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="text-sm text-[#000000] truncate">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenRoleDropdown(openRoleDropdown === i + 4 ? null : i + 4)
                            }
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-all flex-shrink-0 max-w-[80px] truncate ${
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
                        <button
                          onClick={() => removeMember(i + 4)}
                          className="text-xs text-[#666666] hover:text-red-500 w-4 h-4 flex items-center justify-center"
                          title="참석자 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* 세 번째 줄에 하나만 있을 경우 빈 공간 */}
                  {members.slice(4, 6).length === 1 && <div className="w-[calc(50%-6px)]"></div>}
                </div>
              )}
            </div>
          )}

          {/* 참석자가 없을 때 안내 메시지 */}
          {members.length === 0 && (
            <div className="mt-3 text-center py-4 text-sm text-[#666666]">
              팀원 선택 버튼을 눌러 참석자를 추가해주세요
            </div>
          )}
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
        <div className="mb-4">
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
                      <div className="w-3 h-3 border-2 border-[#666666] rounded-full mr-3"></div>
                      <input
                        type="text"
                        value={item.type}
                        onChange={(e) => updateAgendaItem(index, 'type', e.target.value)}
                        className="text-sm text-[#000000] bg-transparent border-none outline-none font-medium placeholder:text-[#CCCCCC]"
                        placeholder="안건 제목"
                      />
                    </div>
                    {agendaItems.length > 1 && (
                      <button
                        onClick={() => removeAgendaItem(index)}
                        className="text-sm text-[#666666] hover:text-[#000000]"
                        title="안건 삭제"
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

        </div>

        {/* 버튼 */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-[#666666] border border-gray-300 hover:bg-gray-100"
          >
            취소
          </Button>
          <Button
            className="bg-[#FFD93D] hover:bg-yellow-400 text-white font-semibold px-6 py-2 text-sm"
            onClick={mode === 'create' ? handleCreateMeeting : handleUpdateMeeting}
          >
            {mode === 'create' ? '회의 만들기' : '회의 수정하기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
