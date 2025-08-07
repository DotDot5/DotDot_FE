import { NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function formatSecondsToMinutesSeconds(totalSeconds: number): string {
  if (totalSeconds < 0) {
    totalSeconds = 0;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
}

export async function POST(req: Request) {
  console.log('API Route POST request received for transcription');
  let speechClient: SpeechClient;
  try {
    speechClient = new SpeechClient();
    console.log('Google SpeechClient initialized successfully');
  } catch (err) {
    console.error('Failed to initialize Google SpeechClient. Check Google Cloud credentials:', err);
    return NextResponse.json(
      { error: 'Server authentication failed. Please check Google Cloud credentials.' },
      { status: 500 }
    );
  }

  try {
    console.log('Starting FormData parsing');
    const formData = await req.formData();
    console.log('FormData parsing completed.');

    const audioFile = formData.get('audio') as Blob | null;
    const meetingIdField = formData.get('meetingId');
    const initialRecordingOffsetSecondsField = formData.get('initialRecordingOffsetSeconds');
    const durationField = formData.get('duration');

    let initialRecordingOffsetSeconds = 0;
    if (initialRecordingOffsetSecondsField) {
      initialRecordingOffsetSeconds = parseFloat(initialRecordingOffsetSecondsField.toString());
      if (isNaN(initialRecordingOffsetSeconds) || initialRecordingOffsetSeconds < 0) {
        initialRecordingOffsetSeconds = 0;
      }
    }
    console.log(
      `[DEBUG] Received initialRecordingOffsetSeconds (leading silence): ${initialRecordingOffsetSeconds} seconds`
    );

    let audioDurationInSeconds = 0;
    if (durationField) {
      audioDurationInSeconds = parseFloat(durationField.toString());
      if (isNaN(audioDurationInSeconds) || audioDurationInSeconds < 0) {
        audioDurationInSeconds = 0;
      }
    }
    const audioChannelCount = 1;
    console.log(`[DEBUG] Using fixed audio channel count: ${audioChannelCount}`);

    if (!audioFile || !(audioFile instanceof Blob)) {
      console.error('POST processing: No valid audio Blob file included in the request.');
      return NextResponse.json({ error: 'Audio file not provided.' }, { status: 400 });
    }
    if (!meetingIdField) {
      console.error('POST processing: Meeting ID not provided.');
      return NextResponse.json({ error: 'Meeting ID not provided.' }, { status: 400 });
    }

    const meetingId = parseInt(meetingIdField.toString(), 10);
    if (isNaN(meetingId)) {
      console.error('POST processing: Invalid Meeting ID provided.');
      return NextResponse.json({ error: 'Invalid Meeting ID.' }, { status: 400 });
    }

    const audioContentBuffer = await audioFile.arrayBuffer();
    const audioContent = Buffer.from(audioContentBuffer).toString('base64');

    console.log(
      'Successfully read audio file content. Size:',
      audioContentBuffer.byteLength,
      'bytes'
    );

    const audio = { content: audioContent };
    const config = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      languageCode: 'ko-KR',
      model: 'latest_long',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      audioChannelCount: 2,
      diarizationConfig: {
        enableSpeakerDiarization: true,
        minSpeakerCount: 1,
        maxSpeakerCount: 5,
      },
    };

    console.log('Starting Google STT request...');
    console.log('[DEBUG] STT Config being sent:', JSON.stringify(config, null, 2));

    const [response] = await speechClient.recognize({ config, audio });
    console.log('Received Google STT response.');

    interface Segment {
      speaker: number;
      text: string;
      startTime: string;
      endTime: string;
    }

    const transcriptionSegments: Segment[] = [];
    let currentSpeaker: number | null = null;
    let currentSegmentText = '';
    let currentSegmentRawStartTimeInSeconds: number | null = null;
    let lastWordEndTimeInSeconds: number = 0;

    response.results?.forEach((result) => {
      result.alternatives?.[0]?.words?.forEach((wordInfo) => {
        const speakerTag = wordInfo.speakerTag;
        const word = wordInfo.word;

        const startSeconds = parseInt((wordInfo.startTime?.seconds as string) || '0', 10);
        const startNanos = wordInfo.startTime?.nanos || 0;
        let startTimeInSeconds = startSeconds + startNanos / 1_000_000_000;

        const endSeconds = parseInt((wordInfo.endTime?.seconds as string) || '0', 10);
        const endNanos = wordInfo.endTime?.nanos || 0;
        let endTimeInSeconds = endSeconds + endNanos / 1_000_000_000;

        startTimeInSeconds += initialRecordingOffsetSeconds;
        endTimeInSeconds += initialRecordingOffsetSeconds;

        if (currentSpeaker === null || speakerTag !== currentSpeaker) {
          if (
            currentSegmentText !== '' &&
            currentSpeaker !== null &&
            currentSegmentRawStartTimeInSeconds !== null
          ) {
            transcriptionSegments.push({
              speaker: currentSpeaker,
              text: currentSegmentText.trim(),
              startTime: formatSecondsToMinutesSeconds(currentSegmentRawStartTimeInSeconds),
              endTime: formatSecondsToMinutesSeconds(lastWordEndTimeInSeconds),
            });
          }
          currentSpeaker = speakerTag;
          currentSegmentText = `${word} `;
          currentSegmentRawStartTimeInSeconds = startTimeInSeconds;
        } else {
          currentSegmentText += `${word} `;
        }
        lastWordEndTimeInSeconds = endTimeInSeconds;
      });
    });

    if (
      currentSegmentText !== '' &&
      currentSpeaker !== null &&
      currentSegmentRawStartTimeInSeconds !== null
    ) {
      transcriptionSegments.push({
        speaker: currentSpeaker,
        text: currentSegmentText.trim(),
        startTime: formatSecondsToMinutesSeconds(currentSegmentRawStartTimeInSeconds),
        endTime: formatSecondsToMinutesSeconds(lastWordEndTimeInSeconds),
      });
    }

    const uniqueSegments = transcriptionSegments.filter(
      (segment, index, self) =>
        index ===
        self.findIndex((s) => s.text === segment.text && s.startTime === segment.startTime)
    );

    const fullTranscriptWithTime = uniqueSegments
      .map((segment) => {
        const speakerName = `사용자 ${segment.speaker}`;
        return `[${speakerName}] (${segment.startTime} - ${segment.endTime}) ${segment.text}`;
      })
      .join('\n');

    console.log(
      'STT conversion successful. Full transcript length:',
      fullTranscriptWithTime.length
    );
    console.log('Audio duration for DB update:', audioDurationInSeconds, 'seconds');

    try {
      const backendApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!backendApiBaseUrl) {
        throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is not set.');
      }
      const updateBackendUrl = `http://localhost:8080/api/v1/meetings/${meetingId}/stt-result`;

      console.log(`Calling Spring Boot backend at: ${updateBackendUrl}`);

      const requestBody = {
        duration: audioDurationInSeconds,
        transcript: fullTranscriptWithTime,
      };

      console.log('[DEBUG] Backend PUT request body:', JSON.stringify(requestBody, null, 2));

      const updateResponse = await fetch(updateBackendUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse
          .json()
          .catch(() => ({ message: 'Unknown backend error' }));
        console.error(
          'Backend DB update request failed response:',
          updateResponse.status,
          errorData
        );
        throw new Error(
          errorData.message ||
            `Backend DB update failed: ${updateResponse.status} ${updateResponse.statusText}`
        );
      }
      console.log(`Successfully updated Meeting ID ${meetingId} via Spring Boot backend`);
    } catch (backendError) {
      console.error(`Error calling Spring Boot backend (meeting_id: ${meetingId}):`, backendError);
      return NextResponse.json(
        {
          error: `Failed to save STT results to DB (Backend error): ${(backendError as Error).message}`,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ sttResultId: meetingId }, { status: 200 });
  } catch (apiError) {
    console.error('Final error during STT API processing (catch block):', apiError);
    return NextResponse.json(
      { error: `An error occurred during speech analysis request: ${(apiError as Error).message}` },
      { status: 500 }
    );
  } finally {
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sttResultId = searchParams.get('sttResultId');

  if (!sttResultId) {
    return NextResponse.json({ error: 'STT Result ID가 제공되지 않았습니다.' }, { status: 400 });
  }

  try {
    const meetingId = parseInt(sttResultId, 10);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: '유효하지 않은 STT Result ID입니다.' }, { status: 400 });
    }

    const backendUrl = `http://localhost:8080/api/v1/meetings/${meetingId}/stt-result`;

    console.log(`[GET /api/transcribe] 백엔드 URL: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: 'GET',
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
