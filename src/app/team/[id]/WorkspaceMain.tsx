'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/internal/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/internal/ui/card';
import Badge from '@/components/internal/ui/badge';
import { Avatar, AvatarFallback } from '@/components/internal/ui/avatar';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/internal/ui/dialog';
import { Input } from '@/components/internal/ui/input';
import { useRouter, useParams } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner'; 
import { useQuery } from '@tanstack/react-query';

import {
  getTeamMembers,
  inviteMember,
  updateMemberRole,
  getTeamNotice,
  updateTeamNotice,
  getTeamDetail
} from '@/api/team';

import { getUpcomingMeetings, getPastMeetings } from '@/api/meeting';


type Member = {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  role: string;
};

export default function WorkspaceMain() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [memberRole, setMemberRole] = useState('');

  const [members, setMembers] = useState<Member[]>([]);

  const [teamName, setTeamName] = useState('');

  const { id } = useParams<{ id: string }>();
  const { data: teamDetail } = useQuery({
    queryKey: ['teamDetail', id],
    queryFn: () => getTeamDetail(id),
    enabled: !!id, // id 있을 때만 요청
    staleTime: 0,
  });
  const { data: upcomingMeetings = [] } = useQuery({
    queryKey: ['upcomingMeetings', id],
    queryFn: () => getUpcomingMeetings(id),
    enabled: !!id,
  });

  const { data: pastMeetings = [] } = useQuery({
    queryKey: ['pastMeetings', id],
    queryFn: () => getPastMeetings(id),
    enabled: !!id,
  });
  const formatDateWithDay = (isoDate: string) => {
    const date = new Date(isoDate);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}.${date.getDate()}(${days[date.getDay()]})`;
  };


  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [currentView, setCurrentView] = useState<
    'workspace' | 'meeting-records' | 'meeting-detail'
  >('workspace');
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);

  const memberScrollRef = useRef<HTMLDivElement>(null);

  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [noticeText, setNoticeText] = useState<string>('');
  const [originalNotice, setOriginalNotice] = useState<string>(''); // 원본 공지사항 저장

  const handleNoticeEdit = () => {
    setIsEditingNotice(true);
  };

  const fetchTeamMembers = async () => {
    try {
      const data = await getTeamMembers(teamId);
      setMembers(data);
    } catch (error) {
      toast.error('팀원 정보를 불러오는 데 실패했습니다.');
    }
  };

  const handleNoticeSave = async () => {
    try {
      await updateTeamNotice(teamId, noticeText);
      console.log('공지사항 수정 성공');
      setOriginalNotice(noticeText);
      setIsEditingNotice(false);
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
    }
  };

  const handleNoticeCancel = () => {
    setNoticeText(originalNotice);
    setIsEditingNotice(false);
  };

  const handleScrollRight = () => {
    if (memberScrollRef.current) {
      memberScrollRef.current.scrollBy({
        left: 200,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollLeft = () => {
    if (memberScrollRef.current) {
      memberScrollRef.current.scrollBy({
        left: -200,
        behavior: 'smooth',
      });
    }
  };

  const handleInviteMember = async () => {
    try {
      await inviteMember(teamId, inviteEmail);
      toast.success('팀원 초대가 완료되었습니다!');
      await fetchTeamMembers();
      setIsInviteModalOpen(false);
      setInviteEmail('');
    } catch (error: any) {
      const errorCode = error.response?.data?.code;
      switch (errorCode) {
        case 'TEAM-002':
          toast.error('이미 팀에 속한 사용자입니다.');
          break;
        case 'USER-001':
          toast.error('존재하지 않는 사용자입니다.');
          break;
        case 'COMMON-006':
          toast.error('올바른 이메일 형식이어야 합니다.');
          break;
        default:
          toast.error('알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setMemberRole(member.role || '');
    setIsMemberModalOpen(true);
  };

  const handleSaveMemberRole = async () => {
    if (!selectedMember) {
      toast.error('수정할 팀원을 선택해주세요.');
      return;
    }

    try {
      await updateMemberRole(teamId, selectedMember.userId, memberRole);
      toast.success('팀원 역할이 성공적으로 수정되었습니다.');
      await fetchTeamMembers();
      setIsMemberModalOpen(false);
    } catch (error: any) {
      const errorCode = error.response?.data?.code;
      switch (errorCode) {
        case 'USER-001':
          toast.error('존재하지 않는 회원입니다.');
          break;
        case 'TEAM-003':
          toast.error('팀에 속하지 않은 사용자입니다.');
          break;
        case 'TEAM-004':
          toast.error('해당 팀에 대한 접근 권한이 없습니다.');
          break;
        case 'USER-006':
          toast.error('로그인이 필요합니다.');
          break;
        default:
          toast.error('역할 수정 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDeleteMember = () => {
    if (selectedMember) {
      setMembers((prev) => prev.filter((member) => member.name !== selectedMember.name));
      setIsMemberModalOpen(false);
      setMemberRole('');
      setSelectedMember(null);
    }
  };

  const handleViewAllMeetings = () => {
    if (typeof teamId === 'string') {
      router.push(`/team/${teamId}/records`);
    }
  };

  const handleBackToWorkspace = () => {
    setCurrentView('workspace');
  };

  const handleViewMeeting = (meetingId: number) => {
    setSelectedMeetingId(meetingId);
    setCurrentView('meeting-detail');
  };

  useEffect(() => {
    const handleScroll = () => {
      // 강제로 리렌더링을 위해 빈 상태 업데이트
      setMembers((prev) => [...prev]);
    };

    const scrollElement = memberScrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const notice = await getTeamNotice(teamId);
        setNoticeText(notice);
        setOriginalNotice(notice);
      } catch (err) {
        console.error('공지사항 불러오기 실패:', err);
      }
    };

    fetchNotice();
  }, [teamId]);

  useEffect(() => {
    fetchTeamMembers();
  }, [teamId]);
  
  useEffect(() => {
    const fetchTeamDetail = async () => {
      if (!id) return;
      try {
        const data = await getTeamDetail(id);
        setTeamName(data.teamName);
      } catch (error) {
        console.error('팀 정보 조회 실패', error);
      }
    };
    fetchTeamDetail();
  }, [id]);


  return (
    // <div className="min-h-screen bg-white">
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-white">
      {/* Yellow Header Section */}
      <div className="bg-[#FFD93D] px-8 py-12">
        <h1 className="text-white text-3xl font-bold">{teamDetail?.teamName}팀의 워크스페이스</h1>
      </div>
      {/* bg-[#FFD93D] */}
      {/* Main Content Cards */}
      <div className="px-8 py-8 bg-white rounded-t-3xl -mt-6 relative">
        {/* Notice and Team Members Section - Split into two cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          {/* Notice Section */}
          <div className="bg-gray-50 rounded-2xl p-6 shadow-sm">
            <Button className="bg-[#FFD93D] hover:bg-yellow-500 text-black font-medium rounded-full px-4 py-2 mb-4">
              공지사항
            </Button>
            {isEditingNotice ? (
              <div className="space-y-3">
                <textarea
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  className="w-full p-3 border border-yellow-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  rows={3}
                  placeholder="공지사항을 입력하세요..."
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNoticeCancel}
                    className="px-4 py-1 text-sm bg-transparent"
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNoticeSave}
                    className="bg-[#FFD93D] hover:bg-yellow-500 text-black px-4 py-1 text-sm"
                  >
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className="text-[#333333] text-sm leading-relaxed cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                onClick={handleNoticeEdit}
              >
                {noticeText.trim() === '' ? (
                  <span className="text-[#666666]">공지사항을 입력하세요...</span>
                ) : (
                  noticeText
                )}
              </p>
            )}
          </div>

          {/* Team Members Section */}
          <div className="bg-gray-50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#333333]">팀 멤버</span>
                <Badge
                  variant="secondary"
                  className="bg-[#FFD93D] text-black rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs"
                >
                  {members.length}
                </Badge>
              </div>
              <Button
                size="sm"
                className="bg-[#FFD93D] hover:bg-yellow-500 text-black rounded-full w-12 h-8 p-0 flex items-center justify-center"
                onClick={handleOpenInviteModal}
              >
                <Plus className="w-8 h-8 text-black stroke-black" />
              </Button>
            </div>
            {/* 팀 멤버 리스트*/}
            <div className="relative">
              {/* 왼쪽 버튼 */}
              {members.length > 5 && (
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1"
                  onClick={handleScrollLeft}
                >
                  <ChevronLeft className="w-5 h-5 text-[#666666]" />
                </button>
              )}
              {/* 멤버 리스트 */}
              <div
                ref={memberScrollRef}
                className="flex items-center gap-3 overflow-x-auto px-8 scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
              >
                {members.map((member, index) => (
                  <Avatar
                    key={index}
                    className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    onClick={() => handleMemberClick(member)}
                  >
                    {member.profileImageUrl && member.profileImageUrl !== 'basic' ? (
                      <img
                        src={member.profileImageUrl}
                        alt={member.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = ''; // fallback 유도
                        }}
                      />
                    ) : (
                      <AvatarFallback className="w-full h-full flex items-center justify-center bg-[#FFD93D] text-white font-bold text-sm rounded-full">
                        {member.name}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))}
              </div>
              {/* 오른쪽 버튼 */}
              {members.length > 5 && (
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1"
                  onClick={handleScrollRight}
                >
                  <ChevronRight className="w-5 h-5 text-[#666666]" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Meetings Card */}
          <Card className="shadow-sm border-0 bg-gray-50 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-[#333333]">
                  다가오는 회의 목록
                </CardTitle>
                <Button
                  onClick={() => router.push('/team/1?modal=create')}
                  className="flex items-center bg-[#FFD93D] hover:bg-yellow-500 text-black font-medium rounded-full px-4 py-2 text-sm"
                >
                  회의 만들기 <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingMeetings.length === 0 ? (
                <p className="text-sm text-[#666666]">예정된 회의가 없습니다.</p>
              ) : (
                upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.meetingId}
                    onClick={() => router.push(`/meeting/${meeting.meetingId}/view`)}
                    className="flex justify-between items-center py-3 border-0"
                  >
                    <div>
                      <span className="text-sm text-[#666666] mr-2">
                        {formatDateWithDay(meeting.meetingAt)}
                      </span>
                      <span className="text-[#333333] font-medium">{meeting.title}</span>
                    </div>
                    <span className="text-sm text-[#666666] border border-gray-300 rounded-full px-3 py-1">
                      {meeting.participantCount}명 참석
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Past Meetings Card */}
          <Card className="shadow-sm border-0 bg-gray-50 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-[#333333]">지난 회의록</CardTitle>
                <Button
                  className="bg-[#FFD93D] hover:bg-yellow-500 text-black font-medium rounded-full px-4 py-2 text-sm"
                  onClick={handleViewAllMeetings}
                >
                  모두 보기
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pastMeetings.length === 0 ? (
                <p className="text-sm text-gray-500">지난 회의록이 없습니다.</p>
              ) : (
                pastMeetings.map((meeting) => (
                  <div
                    key={meeting.meetingId}
                    onClick={() => router.push(`/meeting/${meeting.meetingId}/result`)}
                    className="p-3 bg-white rounded-xl border border-gray-200"
                  >
                    <span className="text-sm text-[#666666] mr-2">
                      {formatDateWithDay(meeting.meetingAt)}
                    </span>
                    <span className="text-[#333333] font-medium">{meeting.title}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Team Member Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              초대할 팀 워크스페이스: <span className="font-bold">{teamDetail?.teamName}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="사용자를 검색하세요"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full border-yellow-400 focus:border-yellow-500 focus:ring-yellow-400"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleInviteMember();
                }
              }}
            />
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-[#333333] border-gray-300 hover:bg-gray-100"
              >
                취소
              </Button>
              <Button
                onClick={handleInviteMember}
                className="bg-[#FFD93D] hover:bg-yellow-500 text-black font-medium px-6"
                disabled={!inviteEmail.trim()}
              >
                초대하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Team Member Management Modal */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="w-full max-w-4xl">
          <DialogHeader>
            <div className="flex items-center gap-4 pb-4">
              {selectedMember && (
                <>
                  <Avatar className="w-16 h-16">
                    {selectedMember.profileImageUrl &&
                    selectedMember.profileImageUrl !== 'basic' ? (
                      <img
                        src={selectedMember.profileImageUrl}
                        alt={selectedMember.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = ''; // fallback 유도
                        }}
                      />
                    ) : (
                      <AvatarFallback className="w-full h-full flex items-center justify-center bg-[#FFD93D] text-white font-bold text-sm rounded-full">
                        {selectedMember.name}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h2 className="text-xl font-semibold">{selectedMember.name}</h2>
                </>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 w-full ">
              <div className="flex items-center justify-between gap-2 w-full">
                <label className="text-sm font-medium text-[#333333]">팀 내 역할</label>
              </div>
              <Input
                placeholder="역할을 입력하세요"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="w-full border-yellow-400 focus:border-yellow-500 focus:ring-yellow-400"
              />
            </div>
            <div className="flex justify-center pt-4 gap-20">
              <Button
                variant="outline"
                onClick={() => setIsMemberModalOpen(false)}
                className="text-[#333333] border-gray-300 hover:bg-gray-100"
              >
                취소
              </Button>
              <Button
                onClick={handleSaveMemberRole}
                className="bg-[#FFD93D] hover:bg-yellow-500 text-black font-medium px-8"
              >
                저장하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
