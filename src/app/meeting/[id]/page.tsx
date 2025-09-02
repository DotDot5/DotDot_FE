'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getMeetingDetail, updateMeetingDetail, askChatbot, getChatHistory, endChatbot } from '@/api/meeting';
import { Button } from '@/components/internal/ui/button';
import { Card, CardContent } from '@/components/internal/ui/card';
import {
  Clock,
  Users,
  Play,
  Pause,
  Square,
  Send,
  X,
  Download,
  Upload,
  Loader2,
  Bookmark,
} from 'lucide-react';
import { Input } from '@/components/internal/ui/input';
import { getMeetingDetailWithParticipantEmails } from '@/api/meeting';
import {
  extractMeetingTasks,
  startMeetingSummary,
  getMeetingSummaryStatus,
  createRecommendations,
  getMeetingSttResult,
  createTeamTask,
} from '@/api/meeting';
import type { MeetingParticipant, UpdateMeetingRequest } from '@/api/meeting';
import { getTeamMembers } from '@/api/team';



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

interface Participant {
  id?: number;
  name?: string;
  email: string;
  role?: string;
  status?: 'accepted' | 'pending' | 'declined';
  userId?: number;
}

// const [postLabel, setPostLabel] = useState<string>('');

// 참석자 정보를 표시하는 컴포넌트
const ParticipantsList = ({ participants }: { participants: Participant[] }) => {
  if (!participants || participants.length === 0) {
    return <div className="text-gray-500">참석자 정보가 없습니다.</div>;
  }

  return (
    <div className="space-y-2">
      {participants.map((participant, index) => (
        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {participant.name
              ? participant.name.charAt(0).toUpperCase()
              : participant.email
              ? participant.email.charAt(0).toUpperCase()
              : '?'}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm text-gray-900">
              {participant.name || '이름 없음'}
            </div>
            <div className="text-xs text-gray-600">{participant.email || '이메일 없음'}</div>
          </div>
          {/* 참석자 역할이나 상태가 있다면 표시 */}
          {participant.role && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {participant.role}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId = Number(params.id);
  const router = useRouter();

  // 녹음 및 파일 관련 상태
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00:00');
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isMeetingEnded, setIsMeetingEnded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 회의 정보 상태
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingDateISO, setMeetingDateISO] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [meetingMethod, setMeetingMethod] = useState<'RECORD' | 'REALTIME'>('REALTIME');
  const [teamId, setTeamId] = useState<number>(0);
  // const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  // const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
  //   { id: 1, type: 'ai', content: 'AI 어시스턴트', timestamp: new Date() },
  //   { id: 2, type: 'ai', content: '궁금한 점이 있으시다면 말씀해주세요', timestamp: new Date() },
  // ]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [postLabel, setPostLabel] = useState<string>('');

  // 이메일 유효성 검증 함수
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 참석자 정보 검증 및 경고 표시
  const getParticipantValidationWarnings = () => {
    const warnings = [];

    participants.forEach((participant, index) => {
      if (!participant.email) {
        warnings.push(`참석자 ${index + 1}: 이메일이 없습니다.`);
      } else if (!validateEmail(participant.email)) {
        warnings.push(`참석자 ${index + 1}: 유효하지 않은 이메일 형식입니다.`);
      }

      if (!participant.name) {
        warnings.push(`참석자 ${index + 1}: 이름이 없습니다.`);
      }
    });

    return warnings;
  };

  // 참석자 정보 수정 기능
  const handleUpdateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value,
    };
    setParticipants(updatedParticipants);
  };

  // 회의 정보 조회 (참석자 데이터 구조 확인 로깅 추가)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMeetingDetailWithParticipantEmails(meetingId);

        // 참석자 데이터 구조 확인을 위한 로깅
        console.log('전체 회의 데이터:', data);
        console.log('참석자 데이터:', data.participants);
        console.log('참석자 데이터 타입:', typeof data.participants);
        console.log('참석자 배열 여부:', Array.isArray(data.participants));

        // 각 참석자 객체 구조 확인
        if (Array.isArray(data.participants) && data.participants.length > 0) {
          console.log('첫 번째 참석자 구조:', data.participants[0]);
          console.log('참석자 키들:', Object.keys(data.participants[0]));
        }

        setMeetingTitle(data.title);
        setMeetingDate(formatKoreanDate(data.meetingAt));
        setMeetingDateISO(data.meetingAt);
        setParticipantCount(data.participants.length);
        setMeetingMethod(data.meetingMethod);
        setParticipants(data.participants);

        // 참석자 정보 유효성 검증
        const participantsWithEmail = data.participants.filter((p: Participant) => p.email);
        console.log('이메일이 있는 참석자 수:', participantsWithEmail.length);
        console.log('이메일이 있는 참석자들:', participantsWithEmail);

        setAgendaItems(
          data.agendas.map((a: { agenda: string; body: string }, i: number) => ({
            id: i + 1,
            title: a.agenda,
            description: a.body,
          }))
        );
        setMeetingNotes(data.note);
        setTeamId(data.teamId);

        const history = await getChatHistory(meetingId);
        const mapped: ChatMessage[] = history.map((h, idx) => ({
          id: idx + 1,
          type: h.role === 'assistant' ? 'ai' : 'user',
          content: h.content,
          timestamp: new Date(),
        }));
        setChatMessages((prev) =>
          mapped.length
            ? mapped
            : [
                { id: 1, type: 'ai', content: 'AI 어시스턴트', timestamp: new Date() },
                {
                  id: 2,
                  type: 'ai',
                  content: '궁금한 점이 있으시다면 말씀해주세요',
                  timestamp: new Date(),
                },
              ]
        );
      } catch (err) {
        console.error('회의 정보/히스토리 불러오기 실패:', err);
      }
    };
    fetchData();
  }, [meetingId]);

  // 메시지가 바뀔 때마다 맨 아래로 스크롤
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 녹음 시간 업데이트
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else if (!isRecording && timer) {
      clearInterval(timer);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRecording, isPaused]);

  // 초를 시간 형식으로 변환
  useEffect(() => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    setRecordingTime(
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
        remainingSeconds
      ).padStart(2, '0')}`
    );
  }, [seconds]);

  // 실시간 녹음 시작 함수
  const handleStartRecording = async () => {
    try {
      const audioContext = new AudioContext();
      const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let systemAudioStream = null;
      try {
        systemAudioStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } catch (e) {
        console.warn('System audio capture not supported or denied:', e);
      }

      const combinedDestination = audioContext.createMediaStreamDestination();
      const micSource = audioContext.createMediaStreamSource(microphoneStream);
      micSource.connect(combinedDestination);

      if (systemAudioStream && systemAudioStream.getAudioTracks().length > 0) {
        const systemSource = audioContext.createMediaStreamSource(systemAudioStream);
        systemSource.connect(combinedDestination);
      } else {
        console.warn('System audio not available. Recording microphone only.');
      }

      const newMediaRecorder = new MediaRecorder(combinedDestination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: 128000, // 비트레이트 설정 (높을수록 좋음)
      });
      newMediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setSeconds(0);
      setRecordedBlob(null);
      audioChunksRef.current = [];

      newMediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current = newMediaRecorder;
    } catch (err) {
      console.error('녹음 시작 실패:', err);
      alert('녹음을 시작할 수 없습니다. 마이크 및 화면 공유 권한을 허용해주세요.');
    }
  };

  const handlePauseResumeRecording = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsMeetingEnded(true);

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
        setRecordedBlob(audioBlob);
        audioChunksRef.current = [];
      };
    }
  };

  const uploadRecordingForTranscription = async (file: Blob | File, duration: number) => {

    const formData = new FormData();
    formData.append('audio', file, `meeting_${meetingId}.webm`);
    formData.append('meetingId', String(meetingId));
    formData.append('duration', String(duration));

    const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Transcription failed');
    return response.json(); // 필요하면 호출부에서 활용
  };

  // 녹음 파일 다운로드 함수
  const handleDownloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      const meetingDate = new Date(meetingDateISO);
      const year = meetingDate.getFullYear();
      const month = String(meetingDate.getMonth() + 1).padStart(2, '0');
      const day = String(meetingDate.getDate()).padStart(2, '0');

      const fileName = `${meetingTitle}_${year}_${month}_${day}.webm`;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // 파일 업로드 처리 함수
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  // 숨겨진 input을 클릭하는 함수
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

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

  const handleAddAgenda = () => {
    const newAgenda: AgendaItem = {
      id: agendaItems.length + 1,
      title: '새 안건',
      description: '',
    };
    setAgendaItems([...agendaItems, newAgenda]);
  };

  const handleUpdateAgenda = (id: number, field: 'title' | 'description', value: string) => {
    setAgendaItems(
      agendaItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  
  const handleUpdateMeeting = async () => {
    try {
      // 화면 전용 participants → 서버 DTO로 변환
      const normalizedParticipants: MeetingParticipant[] = participants
        .filter((p) => typeof p.userId === 'number') // 필수값 보장
        .map((p, idx) => ({
          userId: p.userId as number,
          part: p.role ?? 'member', // 서버의 part로 매핑
          speakerIndex: (p as any).speakerIndex ?? idx, // 없으면 인덱스로 대체
        }));

      const updateData: UpdateMeetingRequest = {
        teamId,
        title: meetingTitle,
        meetingAt: meetingDateISO, // ISO 형식 유지
        meetingMethod, // 'REALTIME' | 'RECORD'
        note: meetingNotes,
        participants: normalizedParticipants,
        agendas: agendaItems.map((item) => ({
          agenda: item.title,
          body: item.description,
        })),
      };

      // 디버깅에 도움
      // console.log('PUT /meetings payload', updateData);

      await updateMeetingDetail(meetingId, updateData);
    } catch (error: any) {
      console.error('회의 정보 수정 실패:', error?.response?.data ?? error);
    }
  };

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || isAsking) return;

    // 1) 사용자 메시지 즉시 반영
    const userMsg: ChatMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      content: text,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setNewMessage('');

    try {
      setIsAsking(true);
      // 2) 서버에 질문
      const { answer } = await askChatbot(meetingId, text);

      // 3) AI 응답 반영
      const aiMsg: ChatMessage = {
        id: userMsg.id + 1,
        type: 'ai',
        content: answer,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      // 실패 안내
      const errMsg: ChatMessage = {
        id: chatMessages.length + 2,
        type: 'ai',
        content: '메시지 전송 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleEndMeeting = async () => {
    try {
      // 전체 플로우 로딩 on
      setIsTranscribing(true);

      // 0) 서버에 최신 회의 정보 저장
      await handleUpdateMeeting();

      // 1) 업로드할 오디오 파악 및 길이 계산
      const [h, m, s] = recordingTime.split(':').map(Number);
      const totalDurationInSeconds = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
      const file = meetingMethod === 'REALTIME' ? recordedBlob : uploadedFile;

      if (!file) {
        alert('오디오가 없습니다. 녹음을 종료했거나 파일을 업로드해야 합니다.');
        return;
      }

      // 2) STT 업로드 → STT 완료 대기
      setPostLabel('음성 분석 업로드 중...');
      await uploadRecordingForTranscription(file, totalDurationInSeconds);

      setPostLabel('음성 인식 결과 대기 중...');
      await waitForStt(meetingId); // getMeetingSttResult를 폴링하는 함수

      // 3) 태스크 자동 추출(dryRun) → 초안(drafts) 저장
      setPostLabel('태스크 자동 추출 중...');
      const extractRes = await extractMeetingTasks(meetingId, {
        dryRun: true,
        overwrite: true,
        includeAgendas: true,
        language: 'ko',
        defaultDueDays: 7,
      });
      // 1) 원본 응답을 통째로 확인
      console.log('[extractRes raw]', JSON.stringify(extractRes, null, 2));

      // 2) 필수 필드들이 유효한지 빠르게 테이블 체크
      console.table(
        (extractRes?.drafts ?? []).map((d) => ({
          assigneeName: d.assigneeName,
          title: d.title,
          priority: d.priority,
          due: d.due,
          dueParseOk: !Number.isNaN(Date.parse(d.due ?? '')),
        }))
      );

      // // 3) 멤버 매핑까지 미리 확인
      // const members = await getTeamMembers(String(teamId));
      // const nameToId = new Map(members.map((m) => [m.name.trim(), m.userId]));

      setPostLabel('태스크 저장 중...');
      if (extractRes?.drafts?.length) {
        // 팀원 이름 → userId 매핑
        const members = await getTeamMembers(String(teamId));
        const nameToId = new Map(members.map((m) => [m.name, m.userId]));
        // 임시 숫자: 오늘 + N일을 due로 사용
        const TEMP_DUE_DAYS = 7; 
        const makeTempDueISO = () => {
          const d = new Date();
          d.setDate(d.getDate() + TEMP_DUE_DAYS);
          return d.toISOString();
        };
        const toPriority = (p: any) =>
          p === 'HIGH' || p === 'LOW' || p === 'MEDIUM' ? p : 'MEDIUM';

        // 초안 각각을 실태스크로 저장
        const results = await Promise.allSettled(
          extractRes.drafts.map((d) => {
            const assigneeId = nameToId.get(d.assigneeName);
            if (!assigneeId) {
              // 담당자 매칭 실패 시 스킵(또는 기본 담당자 지정 로직으로 교체)
              console.warn('담당자 매칭 실패, 스킵:', d.assigneeName, d.title);
              return Promise.resolve();
            }
            return createTeamTask(teamId, {
              title: d.title,
              description: d.description,
              assigneeId,
              priority: toPriority(d.priority),
              status: 'TODO',
              due:
                d.due && !Number.isNaN(Date.parse(d.due))
                  ? new Date(d.due).toISOString()
                  : makeTempDueISO(),
              meetingId,
            });
          })
        );

        // 실패 로그(필요시)
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            console.error('태스크 생성 실패:', extractRes.drafts[i], r.reason);
          }
        });
      }

      // 4) 요약 생성 시작 → 완료까지 대기
      setPostLabel('회의 요약 생성 시작...');
      await startMeetingSummary(meetingId);

      setPostLabel('회의 요약 생성 중...');
      await waitForSummary(meetingId); // getMeetingSummaryStatus를 폴링하는 함수

      // 5) 자료 추천
      setPostLabel('자료 추천 생성 중...');
      await createRecommendations(meetingId, 5);

      // 6) 챗봇 세션 종료(TTL)
      await endChatbot(meetingId);

      // 7) 결과 페이지 이동
      const query = new URLSearchParams({
        title: encodeURIComponent(meetingTitle),
        date: encodeURIComponent(meetingDate),
        participants: String(participantCount),
        participantsData: encodeURIComponent(JSON.stringify(participants)),
      }).toString();

      router.push(`/meeting/${meetingId}/result?${query}`);
    } catch (err: any) {
      console.error('회의 종료 후처리 실패:', err);
      alert(err?.message ?? '회의 종료 후처리 중 오류가 발생했습니다.');
    } finally {
      // 로딩 off & 상태 문구 초기화
      setIsTranscribing(false);
      setPostLabel('');
    }
  };


  const handleDeleteAgenda = (id: number) => {
    setAgendaItems(agendaItems.filter((item) => item.id !== id));
  };

  const getMeetingStatusText = () => {
    if (isTranscribing) {
      return postLabel || '처리 중...';
    }
    if (meetingMethod === 'REALTIME' && isRecording) return '회의 진행 중';
    if (meetingMethod === 'REALTIME' && isMeetingEnded) return '회의 녹음 종료';
    if (meetingMethod === 'RECORD' && uploadedFile) {
      return (
        <>
          <span>파일 업로드 완료</span>
          <br />
          <span>{uploadedFile.name}</span>
        </>
      );
    }
    return '회의 시작 전';
  };
  // STT 결과가 준비될 때까지 폴링 (최대 2분, 2초 간격)
  const waitForStt = async (meetingId: number, timeoutMs = 120000, intervalMs = 2000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      try {
        const stt = await getMeetingSttResult(meetingId);
        if (stt?.transcript && stt.transcript.trim().length > 0) return stt;
      } catch (_) {
        // 아직 준비 안 됨(404/empty 등) -> 무시하고 재시도
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error('STT 결과 대기 시간 초과');
  };

  // 요약 상태가 COMPLETED/FAILED가 될 때까지 폴링 (최대 3분, 2초 간격)
  const waitForSummary = async (meetingId: number, timeoutMs = 180000, intervalMs = 2000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const s = await getMeetingSummaryStatus(meetingId);
      if (s.status === 'COMPLETED') return s;
      if (s.status === 'FAILED') throw new Error('요약 생성에 실패했습니다.');
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error('요약 상태 대기 시간 초과');
  };

  return (
    <div className="h-full bg-gray-50 flex overflow-hidden">
      {/* Main Content - Left Side */}
      <div className="flex-1 flex flex-col relative">
        {/* Fixed Header - 상단 고정 */}
        <div className="flex-shrink-0 p-6 bg-gray-50 border-b border-gray-200">
          <Card className="border border-gray-200">
            <CardContent className="p-6 relative">
              {/* 회의 종료 버튼: 우상단 고정 */}
              <Button
                onClick={handleEndMeeting}
                className="bg-gray-400 hover:bg-[#666666] text-white px-6 py-2 absolute right-6 top-6"
                disabled={
                  isTranscribing ||
                  (meetingMethod === 'REALTIME' && !recordedBlob) ||
                  (meetingMethod === 'RECORD' && !uploadedFile)
                }
              >
                {isTranscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '회의 종료'}
              </Button>

              {/* 좌측 정보 영역: 버튼 자리만큼 패딩 */}
              <div className="pr-28">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
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

                    {/* 참석자 목록 (내용이 길어져도 버튼은 고정) */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        참석자 목록 보기
                      </summary>
                      <div className="mt-2 max-w-md max-h-48 overflow-y-auto">
                        <ParticipantsList participants={participants} />
                      </div>
                    </details>
                  </div>
                </div>
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
            {meetingMethod === 'REALTIME' ? (
              <Card className="bg-gray-400 text-white shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {isRecording && (
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                        <span className="font-mono text-lg">{recordingTime}</span>
                        <span className="text-sm">{getMeetingStatusText()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 회의 시작 전 상태: 시작 버튼 */}
                      {!isRecording && !isMeetingEnded && (
                        <Button
                          onClick={handleStartRecording}
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-[#333333] p-2"
                        >
                          <Play className="w-5 h-5" />
                        </Button>
                      )}

                      {/* 회의 진행 중 상태: 일시정지/재개, 정지 버튼 */}
                      {isRecording && (
                        <>
                          <Button
                            onClick={handlePauseResumeRecording}
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-[#333333] p-2"
                          >
                            {isPaused ? (
                              <Play className="w-5 h-5" />
                            ) : (
                              <Pause className="w-5 h-5" />
                            )}
                          </Button>
                          <Button
                            onClick={handleStopRecording}
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-[#333333] p-2"
                          >
                            <Square className="w-5 h-5" />
                          </Button>
                          {/* 북마크 버튼 */}
                          {/* <Button
                            // onClick={handleAddBookmark}
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-[#333333] p-2"
                            title="현재 시점 북마크"
                            aria-label="북마크 추가"
                          >
                            <Bookmark className="w-5 h-5" />
                          </Button> */}
                        </>
                      )}

                      {/* 회의 녹음 종료 상태: 다운로드 버튼 */}
                      {isMeetingEnded && recordedBlob && (
                        <Button
                          onClick={handleDownloadRecording}
                          size="sm"
                          className="bg-[#3B82F6] hover:bg-green-600 text-white p-2 flex items-center gap-1"
                        >
                          <Download className="w-5 h-5" />
                          다운로드
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-400 text-white shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {uploadedFile && <div className="flex items-center"></div>}
                        <span className="text-sm">{getMeetingStatusText()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="audio/*"
                        className="hidden"
                      />
                      <Button
                        onClick={triggerFileUpload}
                        size="sm"
                        className="bg-[#3B82F6] hover:bg-green-600 text-white p-2 flex items-center gap-1"
                        disabled={isTranscribing}
                      >
                        <Upload className="w-5 h-5" />
                        파일 업로드
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                message.type === 'ai'
                  ? 'bg-gray-100 text-[#333333]'
                  : 'bg-[#3B82F6] text-white ml-auto'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
          {isAsking && (
            <div className="p-3 rounded-lg max-w-[80%] bg-gray-100 text-[#333333]">
              <p className="text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> 답변 생성 중...
              </p>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요"
              className="flex-1"
              disabled={isAsking}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="bg-[#3B82F6] hover:bg-[#3B82F6] text-white p-2"
              disabled={isAsking || !newMessage.trim()}
            >
              {isAsking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
