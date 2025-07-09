'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/internal/ui/button';
import { Card, CardContent } from '@/components/internal/ui/card';
import { Clock, Users, Play, Pause, Square, Send, X } from 'lucide-react';
import { Input } from '@/components/internal/ui/input';
import { useParams } from 'next/navigation';

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

  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { id: 1, title: '백엔드 API 명세서', description: '안건에 대한 메모를 작성하세요' },
    { id: 2, title: '백엔드 API 명세서', description: '안건에 대한 메모를 작성하세요' },
  ]);

  const [meetingNotes, setMeetingNotes] = useState('회의에 대한 질문사항을 자유롭게 메모하세요');
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

  const [newMessage, setNewMessage] = useState('');

  const handleAddAgenda = () => {
    const newAgenda: AgendaItem = {
      id: agendaItems.length + 1,
      title: '새 안건',
      description: '안건에 대한 메모를 작성하세요',
    };
    setAgendaItems([...agendaItems, newAgenda]);
  };

  const handleUpdateAgenda = (id: number, field: 'title' | 'description', value: string) => {
    setAgendaItems(
      agendaItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
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

  const handleEndMeeting = () => {
    console.log('회의 종료');
    router.back(); // ← onBack() 대신
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
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">회의 제목 회의 제목</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>2025.07.01(화) 오후 09:10</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>4명 참석</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleEndMeeting}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2"
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
                  <h2 className="text-xl font-bold text-gray-900">회의 안건</h2>
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
                      <div className="w-3 h-3 border-2 border-gray-400 rounded-full"></div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateAgenda(item.id, 'title', e.target.value)}
                        className="font-medium text-gray-900 bg-transparent border-none outline-none flex-1"
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
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
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
                <h2 className="text-xl font-bold text-gray-900">회의 메모</h2>
              </div>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-lg resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
                style={{ minHeight: '200px', height: 'auto' }}
                placeholder="회의에 대한 질문사항을 자유롭게 메모하세요"
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
            <Card className="bg-gray-600 text-white shadow-xl">
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
                      className="text-white hover:bg-gray-700 p-2"
                    >
                      {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </Button>
                    <Button
                      onClick={handleStopRecording}
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-gray-700 p-2"
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
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <h3 className="font-semibold text-gray-900">AI 어시스턴트</h3>
          </div>
        </div>

        {/* Chat Messages - 독립 스크롤 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                message.type === 'ai'
                  ? 'bg-gray-100 text-gray-900'
                  : message.content === 'AI 어시스턴트'
                    ? 'bg-gray-100 text-gray-900'
                    : message.content === '궁금한신 게 있으시다면 말씀해주세요'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-blue-500 text-white ml-auto'
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
              className="bg-blue-500 hover:bg-blue-600 text-white p-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
