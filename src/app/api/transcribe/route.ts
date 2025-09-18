// route.ts

import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';
const backendBaseUrl = process.env.BACKEND_API_URL || 'http://localhost:8080';

function formatSecondsToMinutesSeconds(totalSeconds: number): string {
  if (totalSeconds < 0) {
    totalSeconds = 0;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function getGoogleCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    return {
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
    }; // Vercel 배포 환경
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    };
  }
  throw new Error('Google Cloud credentials not configured');
}

function hmsToSeconds(hms: string): number {
  const [hours, minutes, seconds] = hms.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    return 0;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

export async function POST(req: Request) {
  console.log('API Route POST request received for transcription');
  let speechClient: SpeechClient;
  let storageClient: Storage;

  try {
    const googleCreds = getGoogleCredentials();
    speechClient = new SpeechClient(googleCreds);
    storageClient = new Storage(googleCreds);
    console.log('Google Cloud clients initialized successfully');
  } catch (err) {
    console.error('Failed to initialize Google Cloud clients. Check credentials:', err);
    return NextResponse.json(
      { error: 'Server authentication failed. Please check Google Cloud credentials.' },
      { status: 500 }
    );
  }

  const audioChannelCount = 2;
  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

  if (!bucketName) {
    console.error('GOOGLE_CLOUD_STORAGE_BUCKET environment variable is not set.');
    return NextResponse.json(
      { error: 'Server configuration error: GCS bucket name is missing.' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;
    const meetingIdField = formData.get('meetingId');
    const durationField = formData.get('duration');
    const initialRecordingOffsetSecondsField = formData.get('initialRecordingOffsetSeconds');
    const meetingMethod = formData.get('meetingMethod')?.toString();

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

    const audioDurationInSeconds = parseFloat(durationField?.toString() || '0');
    const initialRecordingOffsetSeconds = parseFloat(
      initialRecordingOffsetSecondsField?.toString() || '0'
    );

    const audioBytes = Buffer.from(await audioFile.arrayBuffer());
    const tempDir = os.tmpdir();
    const fileName = `meeting_${meetingId}_${Date.now()}.webm`;
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, audioBytes);

    console.log(`Successfully saved audio to local temp file: ${filePath}`);

    const gcsPath = `audios/${fileName}`;
    await storageClient.bucket(bucketName).upload(filePath, {
      destination: gcsPath,
      metadata: {
        contentType: 'audio/webm',
      },
    });
    const gcsUri = `gs://${bucketName}/${gcsPath}`;
    console.log(`File uploaded to GCS: gs://${bucketName}/${gcsPath}`);
    const audioUrl = gcsUri;
    fs.unlinkSync(filePath);
    console.log(`Local temp file deleted: ${filePath}`);

    const audio = {
      uri: `gs://${bucketName}/${gcsPath}`,
    };

    const config = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      languageCode: 'ko-KR',
      model: 'latest_long',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      audioChannelCount: audioChannelCount,
      diarizationConfig: {
        enableSpeakerDiarization: true,
        minSpeakerCount: 1,
        maxSpeakerCount: 5,
      },
    };

    console.log('Starting Google STT long-running request...');
    const [operation] = await speechClient.longRunningRecognize({ config, audio });
    const [response] = await operation.promise();
    console.log('Received Google STT response.');

    interface Segment {
      speaker: number;
      text: string;
      startTime: string;
      endTime: string;
      startTimeInSeconds: number;
      endTimeInSeconds: number;
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

        const silenceDuration =
          lastWordEndTimeInSeconds > 0 ? startTimeInSeconds - lastWordEndTimeInSeconds : 0;

        if (currentSpeaker === null || speakerTag !== currentSpeaker || silenceDuration >= 5) {
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
              startTimeInSeconds: currentSegmentRawStartTimeInSeconds,
              endTimeInSeconds: lastWordEndTimeInSeconds,
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
        startTimeInSeconds: currentSegmentRawStartTimeInSeconds,
        endTimeInSeconds: lastWordEndTimeInSeconds,
      });
    }

    const uniqueSegments = transcriptionSegments.filter(
      (segment, index, self) =>
        index ===
        self.findIndex((s) => s.text === segment.text && s.startTime === segment.startTime)
    );

    const processedSegments = uniqueSegments.map((s) => {
      const processedText = s.text.replace(/\s/g, '').replace(/▁/g, ' ');
      return { ...s, text: processedText };
    });

    const fullTranscript = processedSegments
      .map((s) => `[사용자 ${s.speaker}] (${s.startTime} - ${s.endTime}) ${s.text}`)
      .join('\n');

    let durationToSave: number;

    if (meetingMethod === 'RECORD') {
      const lastSegment = processedSegments[processedSegments.length - 1];
      durationToSave = lastSegment ? Math.floor(lastSegment.endTimeInSeconds) : 0;
    } else {
      durationToSave = Math.floor(audioDurationInSeconds);
    }

    if (durationToSave === 0 && processedSegments.length > 0) {
      console.log('기본 duration이 0이므로, transcript 파싱으로 보정 시작...');
      try {
        const lastParenIndex = fullTranscript.lastIndexOf(')');
        if (lastParenIndex > 8) {
          const endTimeString = fullTranscript.substring(lastParenIndex - 8, lastParenIndex);
          const parsedDuration = hmsToSeconds(endTimeString);

          if (parsedDuration > 0) {
            durationToSave = parsedDuration;
            console.log(`파싱 성공. 보정된 duration: ${durationToSave}`);
          }
        }
      } catch (e) {
        console.error('duration 파싱 중 오류 발생:', e);
      }
    }

    try {
      const updateBackendUrl = `https://api.dotdot.it.kr/api/v1/meetings/${meetingId}/stt-result`;
      console.log(`Calling Spring Boot backend at: ${updateBackendUrl}`);

      const requestBody = {
        duration: durationToSave,
        transcript: fullTranscript,
        audio_id: audioUrl,
        speechLogs: processedSegments.map((s) => ({
          speakerIndex: s.speaker,
          text: s.text,
          startTime: Math.floor(s.startTimeInSeconds),
          endTime: Math.floor(s.endTimeInSeconds),
        })),
      };

      console.log(
        `[DEBUG] Sending to backend: duration=${requestBody.duration}, transcript length=${requestBody.transcript.length}, speechLogs count=${requestBody.speechLogs.length}`
      );

      const updateResponse = await fetch(updateBackendUrl, {
        method: 'POST',
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
      console.log(
        `Successfully updated Meeting ID ${meetingId} and saved speech logs via Spring Boot backend`
      );
    } catch (backendError) {
      console.error(`Error calling Spring Boot backend (meeting_id: ${meetingId}):`, backendError);
      return NextResponse.json(
        {
          error: `Failed to save STT results to DB (Backend error): ${
            (backendError as Error).message
          }`,
        },
        { status: 500 }
      );
    }

    console.log('STT conversion successful. Final Transcript:\n', fullTranscript);

    return NextResponse.json(
      {
        message: '음성 분석 완료. 결과가 DB에 저장되었습니다.',
        success: true,
      },
      { status: 200 }
    );
  } catch (apiError) {
    console.error('Final error during STT API processing (catch block):', apiError);
    return NextResponse.json(
      { error: `An error occurred during speech analysis request: ${(apiError as Error).message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    const backendUrl = `https://api.dotdot.it.kr/api/v1/meetings/${meetingId}/stt-result`;

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
