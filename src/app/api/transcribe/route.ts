import { NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';
import { Storage } from '@google-cloud/storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const backendBaseUrl = process.env.BACKEND_API_URL || 'http://localhost:8080';

// ⭐ 유틸리티 함수들
function formatSecondsToMinutesSeconds(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;
}

function getGoogleCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    return {
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
    };
  }

  if (process.env.GCS_PROJECT_ID && process.env.GCS_CLIENT_EMAIL && process.env.GCS_PRIVATE_KEY) {
    return {
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    };
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    };
  }

  throw new Error('Google Cloud credentials not configured');
}

function getEncodingFromUri(gcsUri: string): string {
  const extension = gcsUri.split('.').pop()?.toLowerCase() || 'webm';
  const encodingMap: { [key: string]: string } = {
    webm: 'WEBM_OPUS',
    opus: 'WEBM_OPUS',
    mp3: 'MP3',
    mpeg: 'MP3',
    mp4: 'MP3',
    m4a: 'MP3',
    wav: 'LINEAR16',
    flac: 'FLAC',
    ogg: 'OGG_OPUS',
  };
  return encodingMap[extension] || 'WEBM_OPUS';
}

interface Segment {
  speaker: number;
  text: string;
  startTime: string;
  endTime: string;
  startTimeInSeconds: number;
  endTimeInSeconds: number;
}

// ⭐⭐ 핵심: 단일 청크 STT 처리
async function processChunkSTT(
  speechClient: SpeechClient,
  gcsUri: string,
  offsetSeconds: number = 0
): Promise<{ segments: Segment[]; transcript: string }> {
  const encoding = getEncodingFromUri(gcsUri);
  const audio = { uri: gcsUri };

  const config = {
    encoding: encoding as any,
    sampleRateHertz: 16000,
    languageCode: 'ko-KR',
    model: 'latest_long',
    enableAutomaticPunctuation: true,
    enableWordTimeOffsets: true,
    audioChannelCount: 2,
    enableSeparateRecognitionPerChannel: false,
    useEnhanced: true,
    metadata: {
      interactionType: 'DISCUSSION',
      microphoneDistance: 'NEARFIELD',
      recordingDeviceType: 'PC',
    },
  };

  const [operation] = await speechClient.longRunningRecognize({ config, audio });

  const [response] = await operation.promise();

  const segments: Segment[] = [];
  let currentSpeaker: number | null = null;
  let currentSegmentText = '';
  let currentSegmentStartTime: number | null = null;
  let lastWordEndTime: number = 0;

  response.results?.forEach((result) => {
    result.alternatives?.[0]?.words?.forEach((wordInfo) => {
      const speakerTag = wordInfo.speakerTag ?? 1;
      const word = wordInfo.word; // 시간 계산

      const startSeconds = parseInt((wordInfo.startTime?.seconds as string) || '0', 10);
      const startNanos = wordInfo.startTime?.nanos || 0;
      let startTimeInSeconds = startSeconds + startNanos / 1_000_000_000;

      const endSeconds = parseInt((wordInfo.endTime?.seconds as string) || '0', 10);
      const endNanos = wordInfo.endTime?.nanos || 0;
      let endTimeInSeconds = endSeconds + endNanos / 1_000_000_000; // ⭐ offset 적용 (청크의 시작 시간 더하기)

      startTimeInSeconds += offsetSeconds;
      endTimeInSeconds += offsetSeconds; // 침묵 구간 계산 (5초 이상이면 새 세그먼트)

      const silenceDuration = lastWordEndTime > 0 ? startTimeInSeconds - lastWordEndTime : 0; // 화자 변경 또는 긴 침묵 → 새 세그먼트

      if (currentSpeaker === null || speakerTag !== currentSpeaker || silenceDuration >= 5) {
        if (
          currentSegmentText !== '' &&
          currentSpeaker !== null &&
          currentSegmentStartTime !== null
        ) {
          segments.push({
            speaker: currentSpeaker,
            text: currentSegmentText.trim(),
            startTime: formatSecondsToMinutesSeconds(currentSegmentStartTime),
            endTime: formatSecondsToMinutesSeconds(lastWordEndTime),
            startTimeInSeconds: currentSegmentStartTime,
            endTimeInSeconds: lastWordEndTime,
          });
        }
        currentSpeaker = speakerTag;
        currentSegmentText = `${word} `;
        currentSegmentStartTime = startTimeInSeconds;
      } else {
        currentSegmentText += `${word} `;
      }
      lastWordEndTime = endTimeInSeconds;
    });
  }); // 마지막 세그먼트 추가

  if (currentSegmentText !== '' && currentSpeaker !== null && currentSegmentStartTime !== null) {
    segments.push({
      speaker: currentSpeaker,
      text: currentSegmentText.trim(),
      startTime: formatSecondsToMinutesSeconds(currentSegmentStartTime),
      endTime: formatSecondsToMinutesSeconds(lastWordEndTime),
      startTimeInSeconds: currentSegmentStartTime,
      endTimeInSeconds: lastWordEndTime,
    });
  } // ⭐ 텍스트 정리

  const processedSegments = segments.map((s) => {
    const processedText = s.text.replace(/\s/g, '').replace(/▁/g, ' ');
    return { ...s, text: processedText };
  });

  const fullTranscript = processedSegments
    .map((s) => `[사용자 ${s.speaker}] (${s.startTime} - ${s.endTime}) ${s.text}`)
    .join('\n');

  return {
    segments: processedSegments,
    transcript: fullTranscript,
  };
}

// ⭐⭐ POST: STT 처리
export async function POST(req: Request) {
  const authorizationHeader = req.headers.get('authorization');

  let speechClient: SpeechClient;

  try {
    const googleCreds = getGoogleCredentials();
    speechClient = new SpeechClient(googleCreds);
  } catch (err) {
    console.error('❌ Failed to initialize Google Cloud client:', err);
    return NextResponse.json(
      { error: 'Server authentication failed. Please check Google Cloud credentials.' },
      { status: 500 }
    );
  }

  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

  if (!bucketName) {
    console.error('❌ GOOGLE_CLOUD_STORAGE_BUCKET not set');
    return NextResponse.json(
      { error: 'Server configuration error: GCS bucket name is missing.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { audioId, meetingId, duration, initialRecordingOffsetSeconds = 0, meetingMethod } = body;

    if (!audioId) {
      console.error('❌ audioId not provided');
      return NextResponse.json({ error: 'Audio ID not provided.' }, { status: 400 });
    }

    if (!meetingId) {
      console.error('❌ meetingId not provided');
      return NextResponse.json({ error: 'Meeting ID not provided.' }, { status: 400 });
    }

    const meetingIdNum = parseInt(String(meetingId), 10);
    if (isNaN(meetingIdNum)) {
      console.error('❌ Invalid meetingId');
      return NextResponse.json({ error: 'Invalid Meeting ID.' }, { status: 400 });
    }

    const gcsUri = audioId.startsWith('gs://') ? audioId : `gs://${bucketName}/${audioId}`;

    if (meetingMethod === 'CHUNK') {
      const { segments, transcript } = await processChunkSTT(
        speechClient,
        gcsUri,
        initialRecordingOffsetSeconds
      );

      return NextResponse.json(
        {
          transcript,
          speechLogs: segments.map((s) => ({
            speakerIndex: s.speaker,
            text: s.text,
            startTime: Math.floor(s.startTimeInSeconds),
            endTime: Math.floor(s.endTimeInSeconds),
          })),
          success: true,
        },
        { status: 200 }
      );
    }

    const { segments, transcript } = await processChunkSTT(speechClient, gcsUri, 0);

    const lastSegment = segments[segments.length - 1];
    let durationToSave = lastSegment ? Math.floor(lastSegment.endTimeInSeconds) : 0;

    if (durationToSave === 0 && duration) {
      durationToSave = Math.floor(parseFloat(String(duration)));
    }

    const updateBackendUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/meetings/${meetingIdNum}/stt-result`;

    const requestBody = {
      duration: durationToSave,
      transcript,
      audio_id: gcsUri,
      speechLogs: segments.map((s) => ({
        speakerIndex: s.speaker,
        text: s.text,
        startTime: Math.floor(s.startTimeInSeconds),
        endTime: Math.floor(s.endTimeInSeconds),
      })),
    };

    const updateResponse = await fetch(updateBackendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorizationHeader || '',
      },
      body: JSON.stringify(requestBody),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse
        .json()
        .catch(() => ({ message: 'Unknown backend error' }));
      console.error('❌ Backend update failed:', updateResponse.status, errorData);
      throw new Error(
        errorData.message ||
          `Backend DB update failed: ${updateResponse.status} ${updateResponse.statusText}`
      );
    }

    return NextResponse.json(
      {
        message: '음성 분석 완료. 결과가 DB에 저장되었습니다.',
        success: true,
      },
      { status: 200 }
    );
  } catch (apiError) {
    console.error('❌ STT API error:', apiError);
    return NextResponse.json(
      { error: `An error occurred during speech analysis: ${(apiError as Error).message}` },
      { status: 500 }
    );
  }
}

// ⭐ GET: STT 결과 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sttResultId = searchParams.get('sttResultId');
  const authorizationHeader = request.headers.get('authorization');

  if (!sttResultId) {
    return NextResponse.json({ error: 'STT Result ID가 제공되지 않았습니다.' }, { status: 400 });
  }

  try {
    const meetingId = parseInt(sttResultId, 10);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: '유효하지 않은 STT Result ID입니다.' }, { status: 400 });
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/meetings/${meetingId}/stt-result`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: authorizationHeader || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('백엔드 GET 요청 실패:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API 라우트에서 오류 발생:', error);
    return NextResponse.json(
      { error: 'STT 결과를 불러오는 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
