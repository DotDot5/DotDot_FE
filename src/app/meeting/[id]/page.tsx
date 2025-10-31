'use client';
import { Bot } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getMeetingDetail,
  getMyMeetingList,
  updateMeetingDetail,
  askChatbot,
  getChatHistory,
  endChatbot,
} from '@/api/meeting';
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
  updateMeetingStatus,
} from '@/api/meeting';
import type { MeetingParticipant, UpdateMeetingRequest } from '@/api/meeting';
import { getTeamMembers } from '@/api/team';
import { toast } from 'sonner';
import { formatKoreanDate } from '@/utils/fotmatDate';

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
  userName?: string;
  profileImageUrl?: string | null;
  email: string;
  role?: string;
  status?: 'accepted' | 'pending' | 'declined';
  userId?: number;
}

const ParticipantsList = ({ participants }: { participants: Participant[] }) => {
  if (!participants || participants.length === 0) {
    return <div className="text-gray-500">참석자 정보가 없습니다.</div>;
  }

  return (
    <div className="space-y-2">
      {participants.map((p, index) => {
        const displayName = p.name ?? p.userName ?? '';
        const initial = displayName
          ? displayName.charAt(0).toUpperCase()
          : p.email
          ? p.email.charAt(0).toUpperCase()
          : '?';
        const avatarUrl =
          p.profileImageUrl && p.profileImageUrl !== 'basic' ? p.profileImageUrl : null;

        return (
          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName || '프로필'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">{displayName || '이름 없음'}</div>
              <div className="text-xs text-gray-600">{p.email || '이메일 없음'}</div>
            </div>

            {p.role && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{p.role}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function MeetingDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const meetingId = Number(rawId); // ✅ 숫자로 정규화
  const router = useRouter();

  const [guardChecked, setGuardChecked] = useState(false); // 가드 완료 플래그
  const [blocked, setBlocked] = useState(false); // 차단 여부

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
  const [meetingMethod, setMeetingMethod] = useState<'RECORD' | 'REALTIME' | 'NONE'>('REALTIME');
  const [teamId, setTeamId] = useState<number>(0);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // 챗봇 관련 상태
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [postLabel, setPostLabel] = useState<string>('');

  // ✅ FINISHED 여부 판정 (내 완료 회의 목록 기반)
  const isFinished = async (id: number) => {
    try {
      const finished = await getMyMeetingList('finished');
      return finished.some((m) => m.meetingId === id);
    } catch (e) {
      console.error('finished 목록 조회 실패:', e);
      return false; // 실패 시 차단하지 않음
    }
  };

  useEffect(() => {
    if (Number.isNaN(meetingId)) {
      router.replace('/meeting/forbidden');
      return;
    }
    let mounted = true;
    (async () => {
      try {
        // 1) FINISHED면 바로 차단
        const done = await isFinished(meetingId);
        if (!mounted) return;
        if (done) {
          setBlocked(true);
          router.replace('/meeting/forbidden');
          return;
        }

        // 2) 표시용 상세 데이터 로딩
        const data = await getMeetingDetailWithParticipantEmails(meetingId);
        if (!mounted) return;

        // 혹시 API가 status를 준다면 2차 방어
        if ((data as any)?.status === 'FINISHED') {
          setBlocked(true);
          router.replace('/meeting/forbidden');
          return;
        }

        setMeetingTitle(data.title);
        setMeetingDate(formatKoreanDate(data.meetingAt));
        setMeetingDateISO(data.meetingAt);
        setParticipantCount(data.participants.length);
        setMeetingMethod(data.meetingMethod);
        setParticipants(data.participants);
        setAgendaItems(
          data.agendas.map((a, i) => ({ id: i + 1, title: a.agenda, description: a.body }))
        );
        setMeetingNotes(data.note);
        setTeamId(data.teamId);
        //채팅 히스토리
        const history = await getChatHistory(meetingId);
        const mapped: ChatMessage[] = history.map((h, idx) => ({
          id: idx + 1,
          type: h.role === 'assistant' ? 'ai' : 'user',
          content: h.content,
          timestamp: new Date(),
        }));
        setChatMessages(
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
      } finally {
        if (mounted) setGuardChecked(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [meetingId, router]);

  // ✅ 화면 사용하는 동안에도 완료되면 즉시 차단
  useEffect(() => {
    let timer: any;
    (async () => {
      // 짧은 인터벌로 과도한 호출은 피함
      timer = setInterval(async () => {
        const done = await isFinished(meetingId);
        if (done) {
          setBlocked(true);
          router.replace('/meeting/forbidden');
        }
      }, 5000);
    })();
    return () => clearInterval(timer);
  }, [meetingId, router]);

  // 이메일 유효성 검증 함수
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPaused]);

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
        bitsPerSecond: 128000,
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
      toast.error('녹음을 시작할 수 없습니다. 마이크 및 화면 공유 권한을 허용해주세요.');
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

  const uploadAudioToGCS = async (audioBlob: Blob, meetingId: number): Promise<string> => {
    try {
      const mimeType = audioBlob.type || 'audio/webm';
      const cleanMimeType = mimeType.split(';')[0].toLowerCase();

      let extension: string;

      if (cleanMimeType.includes('audio/mp4') || cleanMimeType.includes('audio/x-m4a')) {
        extension = 'm4a';
      } else if (cleanMimeType.includes('video/mp4') || cleanMimeType.includes('video/quicktime')) {
        extension = 'mp4';
      } else if (cleanMimeType.includes('audio/mpeg')) {
        extension = 'mp3';
      } else if (cleanMimeType.includes('audio/wav') || cleanMimeType.includes('audio/wave')) {
        extension = 'wav';
      } else if (cleanMimeType.includes('audio/webm')) {
        extension = 'webm';
      } else {
        extension = cleanMimeType.split('/')[1] || 'bin';
      }

      extension = extension.replace(/[^a-z0-9]/g, '');
      if (!extension) extension = 'bin';

      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          meetingId,
          fileName: `audio_${meetingId}_${Date.now()}.${extension}`,
          contentType: mimeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get signed URL');
      }

      const { uploadUrl, audioId } = await response.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: audioBlob,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`GCS upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      return audioId;
    } catch (error) {
      console.error('Audio upload to GCS failed:', error);
      throw error;
    }
  };

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
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
      const normalizedParticipants: MeetingParticipant[] = participants
        .filter((p) => typeof p.userId === 'number')
        .map((p, idx) => ({
          userId: p.userId as number,
          part: p.role ?? 'member',
          speakerIndex: (p as any).speakerIndex ?? idx,
        }));

      const updateData: UpdateMeetingRequest = {
        teamId,
        title: meetingTitle,
        meetingAt: meetingDateISO,
        meetingMethod,
        note: meetingNotes,
        participants: normalizedParticipants,
        agendas: agendaItems.map((item) => ({
          agenda: item.title,
          body: item.description,
        })),
      };

      await updateMeetingDetail(meetingId, updateData);
    } catch (error: any) {
      console.error('회의 정보 수정 실패:', error?.response?.data ?? error);
    }
  };

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || isAsking) return;

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
      const { answer } = await askChatbot(meetingId, text);

      const aiMsg: ChatMessage = {
        id: userMsg.id + 1,
        type: 'ai',
        content: answer,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
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
      await handleUpdateMeeting();

      if (meetingMethod === 'NONE') {
        await updateMeetingStatus(Number(meetingId), 'FINISHED');
        await endChatbot(meetingId).catch(() => {});
        router.push(`/team/records/${meetingId}`);
        return;
      }

      setIsTranscribing(true);
      setPostLabel('오디오 업로드 중...');

      const [h, m, s] = recordingTime.split(':').map(Number);
      const recordingTimeDuration = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
      const file = meetingMethod === 'REALTIME' ? recordedBlob : uploadedFile;

      if (!file) {
        toast.error('오디오가 없습니다. 녹음을 종료했거나 파일을 업로드해야 합니다.');
        setIsTranscribing(false);
        return;
      }

      const audioId = await uploadAudioToGCS(file, meetingId);
      setPostLabel(`음성 분석 중...`);

      const token = localStorage.getItem('accessToken');

      const CLOUD_FUNCTION_URL = process.env.NEXT_PUBLIC_CLOUD_FUNCTION_SPLIT_AUDIO_URL;
      if (!CLOUD_FUNCTION_URL) {
        toast.error(
          '설정 오류: Cloud Function URL이 설정되지 않았습니다. 환경 변수를 확인해주세요.'
        );
        setIsTranscribing(false);
        return; // 즉시 함수 종료
      }
      const splitResponse = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gcsUri: audioId,
          meetingId,
          duration: recordingTimeDuration,
          chunkDuration: 300,
        }),
      });

      if (!splitResponse.ok) {
        const errorDetail = await splitResponse.text();
        console.error('Cloud Function 분할 에러 상세:', errorDetail);
        throw new Error('오디오 분할 실패');
      }

      const splitResult = await splitResponse.json();
      const chunks = splitResult.chunks;

      const actualDuration = splitResult.totalDuration || recordingTimeDuration;

      console.log(`📦 ${chunks.length}개 청크 생성 완료`);

      const results = [];

      const CONCURRENT_LIMIT = 5; // 동시 처리 개수

      for (let i = 0; i < chunks.length; i += CONCURRENT_LIMIT) {
        const batch = chunks.slice(i, i + CONCURRENT_LIMIT);
        const batchResults = await Promise.allSettled(
          batch.map(async (chunk) => {
            try {
              const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  audioId: chunk.gcsUri,
                  meetingId,
                  duration: chunk.duration,
                  initialRecordingOffsetSeconds: chunk.startTime,
                  meetingMethod: 'CHUNK',
                }),
              });

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }

              return await response.json();
            } catch (error) {
              console.error(`❌ 청크 ${chunk.chunkIndex} 실패:`, error);
              throw error;
            }
          })
        );

        // 결과 수집
        batchResults.forEach((result, idx) => {
          const chunk = batch[idx];

          if (result.status === 'fulfilled') {
            console.log(` 청크 ${chunk.chunkIndex + 1} 완료`);
            const transcript = result.value.transcript || '';
            if (!transcript) {
              console.warn(` 청크 ${chunk.chunkIndex + 1}: STT 결과 텍스트가 비어있음`);
            } else {
              // 텍스트가 있다면 로그에 출력
              console.log(
                ` 청크 ${chunk.chunkIndex + 1} STT 결과: "${transcript.substring(0, 50)}..."`
              );
            }
            results.push({
              chunkIndex: chunk.chunkIndex,
              transcript: result.value.transcript || '',
              speechLogs: result.value.speechLogs || [],
            });
          } else {
            console.error(`❌ 청크 ${chunk.chunkIndex + 1} 실패:`, result.reason);
            // 실패해도 빈 결과로 추가 (전체 프로세스 중단 방지)
            results.push({
              chunkIndex: chunk.chunkIndex,
              transcript: '',
              speechLogs: [],
            });
          }
        });
      }
      setPostLabel('STT 결과 병합 중...');
      const fullTranscript = results
        .sort((a, b) => a.chunkIndex - b.chunkIndex)
        .map((r) => r.transcript)
        .filter((t) => t.length > 0)
        .join('\n');

      const allSpeechLogs = results
        .flatMap((r) => r.speechLogs)
        .sort((a, b) => a.startTime - b.startTime);

      // 5단계: 백엔드에 저장
      setPostLabel('STT 결과 저장 중...');

      const sttSaveResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/meetings/${meetingId}/stt-result`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            duration: actualDuration,
            transcript: fullTranscript,
            audio_id: audioId,
            speechLogs: allSpeechLogs,
          }),
        }
      );
      console.log('✅ 전체 STT 처리 완료!');

      console.log('================================');
      console.log(fullTranscript);
      console.log('================================');

      if (!sttSaveResponse.ok) {
        const errorDetail = await sttSaveResponse.text();
        throw new Error(`STT 결과 저장 실패: ${sttSaveResponse.status} - ${errorDetail}`);
      } else {
        console.log('✅ STT 결과 저장 완료');
      }

      setPostLabel('회의 요약 생성 시작...');
      await startMeetingSummary(meetingId);

      setPostLabel('회의 요약 생성 중...');
      await waitForSummary(meetingId);

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

      // 3) 멤버 매핑까지 미리 확인
      setPostLabel('태스크 저장 중...');
      if (extractRes?.drafts?.length) {

        const members = await getTeamMembers(String(teamId));
        const nameToId = new Map(members.map((m) => [m.name, m.userId]));

        const TEMP_DUE_DAYS = 7;
        const makeTempDueISO = () => {
          const d = new Date();
          d.setDate(d.getDate() + TEMP_DUE_DAYS);
          return d.toISOString();
        };
        const toPriority = (p: any) =>
          p === 'HIGH' || p === 'LOW' || p === 'MEDIUM' ? p : 'MEDIUM';

        const results = await Promise.allSettled(
          extractRes.drafts.map((d) => {
            const assigneeId = nameToId.get(d.assigneeName);
            if (!assigneeId) {
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
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            console.error('태스크 생성 실패:', extractRes.drafts[i], r.reason);
          }
        });
      }

      setPostLabel('자료 추천 생성 중...');
      await createRecommendations(meetingId, 5);

      await endChatbot(meetingId);

      await updateMeetingStatus(Number(meetingId), 'FINISHED');

      const query = new URLSearchParams({
        title: encodeURIComponent(meetingTitle),
        date: encodeURIComponent(meetingDate),
        participants: String(participantCount),
        participantsData: encodeURIComponent(JSON.stringify(participants)),
      }).toString();

      router.push(`/meeting/${meetingId}/result?${query}`);
    } catch (err: any) {
      console.error('회의 종료 후처리 실패:', err);
      toast.error(err?.message ?? '회의 종료 후처리 중 오류가 발생했습니다.');
    } finally {
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
    if (meetingMethod === 'NONE') return '녹음 없이 회의 중';
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
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6 bg-gray-50 border-b border-gray-200">
          <Card className="border border-gray-200">
            <CardContent className="p-6 flex items-start justify-between gap-4">
              {/* 회의 종료 버튼: 우상단 고정 */}

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
            </CardContent>
          </Card>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ height: 'calc(100vh - 140px - 120px)' }}
        >
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
                      <div className="w-2 h-2 border-2 border-[#666666] bg-[#666666] rounded-full mr-2"></div>
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
        {meetingMethod !== 'NONE' && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pointer-events-none">
            <div className="pointer-events-auto">
              {meetingMethod === 'REALTIME' ? (
                <div className="bg-gray-400 text-white shadow-xl rounded-lg">
                  <div className="p-4">
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
                  </div>
                </div>
              ) : (
                <div className="bg-gray-400 text-white shadow-xl rounded-lg">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {uploadedFile && <div className="flex items-center"></div>}
                          <span className="text-sm">{getMeetingStatusText()}</span>
                        </div>
                      </div>
                      {/* ⭐⭐⭐ 업로드 버튼 추가 */}
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
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <h3 className="font-semibold text-[#333333]">AI 어시스턴트</h3>
          </div>
        </div>
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
