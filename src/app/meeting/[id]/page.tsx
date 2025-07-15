'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getMeetingDetail, updateMeetingDetail } from '@/api/meeting';
import { Button } from '@/components/internal/ui/button';
import { Card, CardContent } from '@/components/internal/ui/card';
import { Clock, Users, Play, Pause, Square, Send, X } from 'lucide-react';
import { Input } from '@/components/internal/ui/input';

// interface PageProps {
//   params: { id: string }; // URL의 [id]를 받기 위한 타입
// }

interface AgendaItem {
  id: number;
  title: string;
  description: string;
}

interface ChatMessage {
  id: number;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export default function MeetingDetailPage() {
  // const meetingId = Number(params.id); // 문자열을 숫자로 변환
  const params = useParams();
  const meetingId = Number(params.id);
  const router = useRouter();

  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:15:32');

  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(''); // 화면용
  const [meetingDateISO, setMeetingDateISO] = useState(''); // API용
  const [participantCount, setParticipantCount] = useState(0);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [meetingMethod, setMeetingMethod] = useState<'RECORD' | 'REALTIME'>('RECORD'); // 회의 방법
  const [teamId, setTeamId] = useState<number>(0); // 팀 ID 상태 추가
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);

  // const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
  //   { id: 1, title: '백엔드 API 명세서', description: '안건에 대한 메모를 작성하세요' },
  //   { id: 2, title: '백엔드 API 명세서', description: '안건에 대한 메모를 작성하세요' },
  // ]);

  // const [meetingNotes, setMeetingNotes] = useState('회의에 대한 질문사항을 자유롭게 메모하세요');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, type: 'ai', content: 'AI 어시스턴트', timestamp: new Date() },
    { id: 2, type: 'user', content: '궁금한신 게 있으시다면 말씀해주세요', timestamp: new Date() },
    {
      id: 3,
      type: 'user',
      content: '이건 어떻게 해야해? 이건 어떻게 해야해?',
      timestamp: new Date(),
    },
    { id: 4, type: 'user', content: '그건...', timestamp: new Date() },
  ]);

  // 회의 정보 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMeetingDetail(meetingId);
        setMeetingTitle(data.title);
        setMeetingDate(formatKoreanDate(data.meetingAt)); // 포맷 함수는 아래 정의
        setMeetingDateISO(data.meetingAt); // ISO 포맷 그대로 저장
        setParticipantCount(data.participants.length);
        setMeetingMethod(data.meetingMethod);
        setParticipants(data.participants);
        setAgendaItems(
          data.agendas.map((a, i) => ({
            id: i + 1,
            title: a.agenda,
            description: a.body,
          }))
        );
        setMeetingNotes(data.note);
        setTeamId(data.teamId); // teamId 상태 설정
      } catch (err) {
        console.error('회의 정보 불러오기 실패:', err);
      }
    };
    fetchData();
  }, [meetingId]);

  const formatKoreanDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
    const time = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${day} ${time}`;
  };

  // 안건 추가
  const handleAddAgenda = () => {
    const newAgenda: AgendaItem = {
      id: agendaItems.length + 1,
      title: '새 안건',
      description: '',
    };
    setAgendaItems([...agendaItems, newAgenda]);
  };

  // 안건 수정
  const handleUpdateAgenda = (id: number, field: 'title' | 'description', value: string) => {
    setAgendaItems(
      agendaItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // 회의 정보 업데이트
  const handleUpdateMeeting = async () => {
    try {
      const updateData = {
        teamId, // teamId 추가
        title: meetingTitle,
        meetingAt: meetingDateISO,
        meetingMethod,
        note: meetingNotes,
        participants: participants, // 참가자 목록 처리해야 함
        agendas: agendaItems.map((item) => ({
          agenda: item.title,
          body: item.description,
        })),
      };
      await updateMeetingDetail(meetingId, updateData);
      router.push(`/meetings/${meetingId}`); // 수정 후 페이지 리디렉션
    } catch (error) {
      console.error('회의 정보 수정 실패:', error);
    }
  };
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: chatMessages.length + 1,
        type: 'user',
        content: newMessage,
        timestamp: new Date(),
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleEndMeeting = async () => {
    try {
      await handleUpdateMeeting(); // 회의 정보 저장
      router.push(`/meeting/${meetingId}/result`);
    } catch (err) {
      console.error('회의 종료 중 오류:', err);
    }
  };

  const handleDeleteAgenda = (id: number) => {
    setAgendaItems(agendaItems.filter((item) => item.id !== id));
  };

  return (
    <div className="h-full bg-gray-50 flex overflow-hidden">
      {/* Main Content - Left Side */}
      <div className="flex-1 flex flex-col relative">
        {/* Fixed Header - 상단 고정 */}
        <div className="flex-shrink-0 p-6 bg-gray-50 border-b border-gray-200">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#333333] mb-2">{meetingTitle}</h1>
                  <div className="flex items-center gap-4 text-sm text-[#666666]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{meetingDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{participantCount}명 참석</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleEndMeeting}
                  className="bg-gray-400 hover:bg-[#666666] text-white px-6 py-2"
                >
                  회의 종료
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scrollable Content - 중간 스크롤 영역 */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ height: 'calc(100vh - 140px - 120px)' }}
        >
          {/* Meeting Agenda */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <h2 className="text-xl font-bold text-[#333333]">회의 안건</h2>
                </div>
                <Button
                  onClick={handleAddAgenda}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-transparent"
                >
                  추가
                </Button>
              </div>

              <div className="space-y-4">
                {agendaItems.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-[#666666] rounded-full"></div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateAgenda(item.id, 'title', e.target.value)}
                        className="font-medium text-[#333333] bg-transparent border-none outline-none flex-1"
                      />
                      <Button
                        onClick={() => handleDeleteAgenda(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleUpdateAgenda(item.id, 'description', e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm text-[#333333]"
                      style={{ minHeight: '80px', height: 'auto' }}
                      placeholder="안건에 대한 메모를 작성하세요"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meeting Notes */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📝</span>
                <h2 className="text-xl font-bold text-[#333333]">회의 메모</h2>
              </div>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-lg resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-sm text-[#333333]"
                style={{ minHeight: '200px', height: 'auto' }}
                placeholder="회의에 대한 내용을 자유롭게 메모하세요"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Fixed Recording Controls - 하단 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <Card className="bg-gray-400 text-white shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="font-mono text-lg">{recordingTime}</span>
                      <span className="text-sm">회의 진행 중</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePauseResume}
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-[#333333] p-2"
                    >
                      {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </Button>
                    <Button
                      onClick={handleStopRecording}
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-[#333333] p-2"
                    >
                      <Square className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar - 오른쪽 독립 스크롤 */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        {/* Chat Header - 고정 */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <h3 className="font-semibold text-[#333333]">AI 어시스턴트</h3>
          </div>
        </div>

        {/* Chat Messages - 독립 스크롤 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                message.type === 'ai'
                  ? 'bg-gray-100 text-[#333333]'
                  : message.content === 'AI 어시스턴트'
                    ? 'bg-gray-100 text-[#333333]'
                    : message.content === '궁금한신 게 있으시다면 말씀해주세요'
                      ? 'bg-gray-200 text-[#333333]'
                      : 'bg-[#3B82F6] text-white ml-auto'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          ))}
        </div>

        {/* Chat Input - 고정 */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="bg-[#3B82F6] hover:bg-[#3B82F6] text-white p-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
