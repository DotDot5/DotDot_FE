'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/internal/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/internal/ui/card';
import Badge from '@/components/internal/ui/badge';
import { Avatar, AvatarFallback } from '@/components/internal/ui/avatar';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/internal/ui/dialog';
import { Input } from '@/components/internal/ui/input';
import { useRouter } from 'next/navigation';

export default function WorkspaceMain() {
  const router = useRouter();
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    name: string;
    color: string;
    role?: string;
  } | null>(null);
  const [memberRole, setMemberRole] = useState('');
  const [teamMembers, setTeamMembers] = useState([
    { name: '다은', color: 'bg-purple-400', role: '' },
    { name: '예린', color: 'bg-green-500', role: '' },
    { name: '세현', color: 'bg-[#FFD93D]', role: '' },
  ]);

  const [upcomingMeetings] = useState([
    { date: '05.20(목)', title: '제품 출시 회의', attendees: '1명 참석' },
    { date: '05.20(목)', title: '제품 출시 회의', attendees: '1명 참석' },
    { date: '05.20(목)', title: '제품 출시 회의', attendees: '1명 참석' },
  ]);

  const [pastMeetings] = useState([
    { date: '05.20(목)', title: '제품 출시 회의' },
    { date: '05.20(목)', title: '제품 출시 회의' },
    { date: '05.20(목)', title: '제품 출시 회의' },
    { date: '05.20(목)', title: '제품 출시 회의' },
    { date: '05.20(목)', title: '제품 출시 회의' },
  ]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [currentView, setCurrentView] = useState<
    'workspace' | 'meeting-records' | 'meeting-detail'
  >('workspace');
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);

  const memberScrollRef = useRef<HTMLDivElement>(null);

  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [noticeText, setNoticeText] = useState(
    '다가오는 제품 최근 회의는 중요한 안건을 다룰 예정이니, 모든 팀원들의 참석이 필수입니다'
  );

  const handleNoticeEdit = () => {
    setIsEditingNotice(true);
  };

  const handleNoticeSave = () => {
    setIsEditingNotice(false);
    console.log('공지사항 저장:', noticeText);
  };

  const handleNoticeCancel = () => {
    setIsEditingNotice(false);
    setNoticeText(
      '다가오는 제품 최근 회의는 중요한 안건을 다룰 예정이니, 모든 팀원들의 참석이 필수입니다'
    );
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

  const handleInviteMember = () => {
    if (inviteEmail.trim()) {
      // 새로운 팀 멤버 추가
      const newMember = {
        name: inviteEmail.split('@')[0], // 이메일에서 이름 추출
        color: `bg-${['purple', 'green', 'blue', 'red', 'pink', 'indigo', 'orange'][Math.floor(Math.random() * 7)]}-400`,
        role: '',
      };
      setTeamMembers((prev) => [...prev, newMember]);

      console.log(`팀 멤버 초대: ${inviteEmail}`);
      setInviteEmail('');
      setIsInviteModalOpen(false);
    }
  };

  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const handleMemberClick = (member: { name: string; color: string; role?: string }) => {
    setSelectedMember(member);
    setMemberRole(member.role || '');
    setIsMemberModalOpen(true);
  };

  const handleSaveMemberRole = () => {
    if (selectedMember) {
      setTeamMembers((prev) =>
        prev.map((member) =>
          member.name === selectedMember.name ? { ...member, role: memberRole } : member
        )
      );
      setIsMemberModalOpen(false);
      setMemberRole('');
      setSelectedMember(null);
    }
  };

  const handleDeleteMember = () => {
    if (selectedMember) {
      setTeamMembers((prev) => prev.filter((member) => member.name !== selectedMember.name));
      setIsMemberModalOpen(false);
      setMemberRole('');
      setSelectedMember(null);
    }
  };

  const handleViewAllMeetings = () => {
    router.push('/team/records');
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
      setTeamMembers((prev) => [...prev]);
    };

    const scrollElement = memberScrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    // <div className="min-h-screen bg-white">
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-white">
      {/* Yellow Header Section */}
      <div className="bg-[#FFD93D] px-8 py-12">
        <h1 className="text-white text-3xl font-bold">DotDot 팀의 워크스페이스</h1>
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
                className="text-gray-700 text-sm leading-relaxed cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                onClick={handleNoticeEdit}
              >
                {noticeText}
              </p>
            )}
          </div>

          {/* Team Members Section */}
          <div className="bg-gray-50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">팀 멤버</span>
                <Badge
                  variant="secondary"
                  className="bg-[#FFD93D] text-black rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs"
                >
                  {teamMembers.length}
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
            <div className="flex items-center justify-between">
              {teamMembers.length > 5 && (memberScrollRef.current?.scrollLeft ?? 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 p-0 h-auto hover:bg-transparent"
                  onClick={handleScrollLeft}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </Button>
              )}

              <div
                ref={memberScrollRef}
                className="flex items-center gap-3 overflow-x-hidden flex-1"
                style={{ scrollBehavior: 'smooth' }}
              >
                {teamMembers.map((member, index) => (
                  <Avatar
                    key={index}
                    className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    onClick={() => handleMemberClick(member)}
                  >
                    <AvatarFallback
                      className={`${member.color} text-white text-sm font-medium rounded-full`}
                    >
                      {member.name}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {teamMembers.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 p-0 h-auto hover:bg-transparent"
                  onClick={handleScrollRight}
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Meetings Card */}
          <Card className="shadow-sm border-0 bg-gray-50 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-gray-900">
                  다가오는 회의 목록
                </CardTitle>
                <Button className="flex items-center bg-[#FFD93D] hover:bg-yellow-500 text-black font-medium rounded-full px-4 py-2 text-sm">
                  회의 만들기 <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingMeetings.map((meeting, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-0">
                  <div>
                    <span className="text-sm text-gray-600 mr-2">{meeting.date}</span>
                    <span className="text-gray-900 font-medium">{meeting.title}</span>
                  </div>
                  <span className="text-sm text-gray-500">{meeting.attendees}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Past Meetings Card */}
          <Card className="shadow-sm border-0 bg-gray-50 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-gray-900">지난 회의록</CardTitle>
                <Button
                  className="bg-[#FFD93D] hover:bg-yellow-500 text-black font-medium rounded-full px-4 py-2 text-sm"
                  onClick={handleViewAllMeetings}
                >
                  모두 보기
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pastMeetings.map((meeting, index) => (
                <div key={index} className="p-3 bg-white rounded-xl border border-gray-200">
                  <span className="text-sm text-gray-600 mr-2">{meeting.date}</span>
                  <span className="text-gray-900 font-medium">{meeting.title}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Team Member Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              초대할 팀 워크스페이스: <span className="font-bold">DotDot</span>
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
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
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
                    <AvatarFallback
                      className={`${selectedMember.color} text-white text-lg font-medium rounded-full`}
                    >
                      {selectedMember.name}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">김{selectedMember.name}</h2>
                </>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 w-full ">
              <div className="flex items-center justify-between gap-2 w-full">
                <label className="text-sm font-medium text-gray-700">팀 내 역할</label>
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
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
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
