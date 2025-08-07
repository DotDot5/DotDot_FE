'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getMeetingDetail, updateMeetingDetail } from '@/api/meeting';
import { Button } from '@/components/internal/ui/button';
import { Card, CardContent } from '@/components/internal/ui/card';
import { Clock, Users, Play, Pause, Square, Send, X, Download, Upload } from 'lucide-react';
import { Input } from '@/components/internal/ui/input';
import { transcribeAudio } from '@/api/stt';

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
  const params = useParams();
  const meetingId = Number(params.id);
  const router = useRouter();

  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingDateISO, setMeetingDateISO] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [meetingMethod, setMeetingMethod] = useState<'RECORD' | 'REALTIME'>('RECORD');
  const [teamId, setTeamId] = useState<number>(0);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
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

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00:00');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isMeetingEnded, setIsMeetingEnded] = useState(false);
  const [finalRecordingTime, setFinalRecordingTime] = useState('00:00:00');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (isMeetingEnded) {
      setFinalRecordingTime(recordingTime);
    }
  }, [isMeetingEnded, recordingTime]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor(
          (Date.now() - startTimeRef.current + pausedTimeRef.current) / 1000
        );
        const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(elapsedSeconds % 60).padStart(2, '0');
        setRecordingTime(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      console.log('[Cleanup Effect] Timer cleanup triggered!');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
        console.log('Recorded audio URL revoked on unmount.');
      }
    };
  }, [recordedAudioUrl]);

  const handleStartRecording = async () => {
    console.log('[handleStartRecording] 함수 시작');
    try {
      // 기존 상태 초기화 로직 유지
      setIsMeetingEnded(false);
      setFinalRecordingTime('00:00:00');
      setRecordedBlob(null);
      setAudioDurationSeconds(0);
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudioUrl(null);
      }
      setIsTranscribing(false);

      alert(
        "컴퓨터의 소리도 함께 녹음하려면 화면 공유 팝업에서 '시스템 오디오 공유'를 체크해주세요."
      );

      // 1. 화면 공유 스트림과 마이크 스트림을 동시에 요청합니다.
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. AudioContext를 생성합니다.
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // 3. 화면 공유 스트림의 오디오 소스를 AudioContext에 연결합니다.
      const screenSource = audioContext.createMediaStreamSource(screenStream);
      screenSource.connect(destination);

      // 4. 마이크 스트림의 오디오 소스를 AudioContext에 연결합니다.
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);

      // 5. 혼합된 오디오 스트림을 MediaRecorder에 전달합니다.
      const combinedStream = destination.stream;
      audioStreamRef.current = combinedStream;

      const options = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = recorder;

      // ... 기존 MediaRecorder 이벤트 핸들러 로직 유지 (onstop, ondataavailable 등) ...
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // 기존 onstop 로직 유지
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        // 모든 스트림 트랙을 정지합니다.
        micStream.getTracks().forEach((track) => track.stop());
        screenStream.getTracks().forEach((track) => track.stop());

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }

        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setIsMeetingEnded(true);

        // AudioContext를 닫습니다.
        audioContext.close();
      };

      // 6. 녹음을 시작하고 상태를 업데이트합니다.
      recorder.start(1000);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setRecordingTime('00:00:00');
      setIsRecording(true);
      setIsPaused(false);
      console.log('[handleStartRecording] 녹음 시작 상태 설정 완료');
    } catch (err) {
      console.error('[handleStartRecording] 오류 발생:', err);
      setIsRecording(false);
      setIsPaused(false);
      setRecordedBlob(null);
      setAudioDurationSeconds(0);
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      setRecordedAudioUrl(null);
      if ((err as DOMException).name === 'NotAllowedError') {
        alert('마이크 또는 화면 공유 권한이 거부되었습니다. 권한을 허용하고 다시 시도해주세요.');
      } else if ((err as DOMException).name === 'NotFoundError') {
        alert('마이크 장치를 찾을 수 없습니다.');
      } else {
        alert(`녹음 시작 중 오류 발생: ${(err as Error).message}`);
      }
    }
  };

  const handlePauseResumeRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      console.warn('MediaRecorder is not active. Cannot pause/resume.');
      return;
    }
    if (recorder.state === 'recording') {
      recorder.pause();
      pausedTimeRef.current += Date.now() - startTimeRef.current;
      setIsPaused(true);
    } else if (recorder.state === 'paused') {
      recorder.resume();
      startTimeRef.current = Date.now();
      setIsPaused(false);
    } else {
      console.warn(`Cannot perform action. Current state: ${recorder.state}`);
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      console.warn('MediaRecorder not active or already inactive.');
      return;
    }
    recorder.stop();
    setIsRecording(false);
    setIsPaused(false);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  };

  const handleDownloadRecording = () => {
    if (recordedAudioUrl && recordedBlob) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = recordedAudioUrl;
      const date = new Date(meetingDateISO);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}_${month}_${day}`;
      const fileName = `${meetingTitle}_${formattedDate}.webm`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      console.warn('No recorded audio available for download.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const audio = new Audio(URL.createObjectURL(file));
      audio.onloadedmetadata = () => {
        setAudioDurationSeconds(audio.duration);
        console.log('업로드된 파일 길이:', audio.duration, '초');
      };
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMeetingDetail(meetingId);
        setMeetingTitle(data.title);
        setMeetingDate(formatKoreanDate(data.meetingAt));
        setMeetingDateISO(data.meetingAt);
        setParticipantCount(data.participants.length);
        setMeetingMethod(data.meetingMethod);
        setParticipants(data.participants);
        setAgendaItems(
          data.agendas.map((a: any, i: number) => ({
            id: i + 1,
            title: a.agenda,
            description: a.body,
          }))
        );
        setMeetingNotes(data.note);
        setTeamId(data.teamId);
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
      const updateData = {
        teamId,
        title: meetingTitle,
        meetingAt: meetingDateISO,
        meetingMethod,
        note: meetingNotes,
        participants: participants,
        agendas: agendaItems.map((item) => ({
          agenda: item.title,
          body: item.description,
        })),
      };
      await updateMeetingDetail(meetingId, updateData);
      console.log('회의 정보 업데이트 성공');
    } catch (error) {
      console.error('회의 정보 수정 실패:', error);
      alert(`회의 정보 저장 중 오류 발생: ${(error as Error).message}`);
      throw error;
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

  const calculateTotalSeconds = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length !== 3) {
      console.error('Invalid time format:', timeString);
      return 0;
    }
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const handleEndMeeting = async () => {
    console.log('회의 종료 처리 시작...');
    setIsTranscribing(true);
    try {
      if (meetingMethod === 'REALTIME') {
        if (isRecording) {
          handleStopRecording();
          await new Promise<void>((resolve) => {
            const checkBlobInterval = setInterval(() => {
              if (recordedBlob) {
                clearInterval(checkBlobInterval);
                resolve();
              }
            }, 100);
          });
        }
      }
      await handleUpdateMeeting();
      const commonQueryParams = new URLSearchParams();
      commonQueryParams.append('meetingTitle', encodeURIComponent(meetingTitle));
      commonQueryParams.append('meetingDateISO', encodeURIComponent(meetingDateISO));
      commonQueryParams.append('participantCount', participantCount.toString());
      let audioToProcess: Blob | null = null;
      let fileName: string | null = null;
      let durationToProcess: number | null = null;
      if (meetingMethod === 'REALTIME' && recordedBlob) {
        audioToProcess = recordedBlob;
        const calculatedDuration = calculateTotalSeconds(finalRecordingTime);
        durationToProcess = calculatedDuration > 0 ? calculatedDuration : audioDurationSeconds;
        console.log(
          `[REALTIME] Calculated duration: ${calculatedDuration}, audioDurationSeconds: ${audioDurationSeconds}`
        );
        if (durationToProcess === 0) {
          console.warn('Realtime audio duration is 0, transcribeAudio will likely fail.');
        }
        const date = new Date(meetingDateISO);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        fileName = `${meetingTitle}_${year}_${month}_${day}.webm`;
      } else if (meetingMethod === 'RECORD' && uploadedFile) {
        audioToProcess = uploadedFile;
        durationToProcess = audioDurationSeconds;
        fileName = uploadedFile.name;
        durationToProcess = await new Promise<number>((resolve) => {
          const audio = new Audio(URL.createObjectURL(uploadedFile));
          audio.onloadedmetadata = () => {
            const duration = audio.duration;
            if (isFinite(duration) && duration > 0) {
              resolve(duration);
            } else {
              console.warn('업로드된 파일의 duration이 유효하지 않습니다. 0으로 처리합니다.');
              resolve(0);
            }
            URL.revokeObjectURL(audio.src);
          };
          audio.onerror = () => {
            console.error('업로드된 파일의 메타데이터를 읽는 데 실패했습니다. 0으로 처리합니다.');
            resolve(0);
            URL.revokeObjectURL(audio.src);
          };
        });
      }
      if (audioToProcess && fileName) {
        console.log('회의 종료: STT를 위해 오디오 파일을 서버로 전송합니다.');
        console.log(`Audio duration for STT to be sent: ${durationToProcess} seconds`);
        const sttResultId = await transcribeAudio(
          audioToProcess,
          fileName,
          meetingId,
          durationToProcess
        );
        console.log('STT 요청 성공. STT 결과 ID:', sttResultId);
        commonQueryParams.append('sttResultId', sttResultId);
        router.push(`/meeting/${meetingId}/result?${commonQueryParams.toString()}`);
      } else {
        console.warn('처리할 오디오가 없어 STT를 실행하지 않고 결과 페이지로 이동합니다.');
        alert('처리할 오디오가 없습니다. 결과 페이지로 이동합니다.');
        router.push(`/meeting/${meetingId}/result?${commonQueryParams.toString()}`);
      }
    } catch (err) {
      console.error('회의 종료 및 처리 중 오류:', err);
      alert(`회의 종료 처리 중 오류가 발생했습니다: ${(err as Error).message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDeleteAgenda = (id: number) => {
    setAgendaItems(agendaItems.filter((item) => item.id !== id));
  };

  const getMeetingStatusText = () => {
    if (isTranscribing) {
      return '음성 분석 요청 중...';
    }
    if (meetingMethod === 'REALTIME' && isRecording) {
      return '회의 진행 중';
    }
    if (meetingMethod === 'REALTIME' && isMeetingEnded) {
      return '회의 녹음 종료';
    }
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

  return (
    <div className="h-full bg-gray-50 flex overflow-hidden">
      <div className="flex-1 flex flex-col relative">
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
                  disabled={
                    isTranscribing ||
                    (meetingMethod === 'REALTIME' && isRecording && !recordedBlob) ||
                    (meetingMethod === 'RECORD' && !uploadedFile)
                  }
                >
                  {isTranscribing ? '처리 중...' : '회의 종료'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            {meetingMethod === 'REALTIME' ? (
              <Card className="bg-gray-400 text-white shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {isRecording && !isPaused && (
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                        <span className="font-mono text-lg">{recordingTime}</span>
                        <span className="text-sm">{getMeetingStatusText()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isRecording && !recordedAudioUrl && (
                        <Button
                          onClick={handleStartRecording}
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-[#333333] p-2"
                          disabled={isTranscribing}
                        >
                          <Play className="w-5 h-5" />
                        </Button>
                      )}
                      {isRecording && (
                        <Button
                          onClick={handlePauseResumeRecording}
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-[#333333] p-2"
                        >
                          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                        </Button>
                      )}
                      {isRecording && (
                        <Button
                          onClick={handleStopRecording}
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-[#333333] p-2"
                        >
                          <Square className="w-5 h-5" />
                        </Button>
                      )}
                      {!isRecording && recordedAudioUrl && !isTranscribing && (
                        <Button
                          onClick={handleDownloadRecording}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white p-2 flex items-center gap-1"
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
                        className="bg-[#3B82F6] hover:bg-[#3B82F6] text-white p-2 flex items-center gap-1"
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
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <h3 className="font-semibold text-[#333333]">AI 어시스턴트</h3>
          </div>
        </div>
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
