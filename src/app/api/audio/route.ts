import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export const dynamic = 'force-dynamic';

function initializeStorageClient(): Storage {
  if (process.env.GOOGLE_CREDENTIALS) {
    return new Storage({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    });
  }
  if (process.env.GCS_PROJECT_ID && process.env.GCS_CLIENT_EMAIL && process.env.GCS_PRIVATE_KEY) {
    return new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });
  }
  return new Storage();
}

export async function GET(request: NextRequest) {
  console.log('Audio API GET request received');

  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get('meetingId');
  const audioId = searchParams.get('audioId');

  if (!meetingId && !audioId) {
    console.error('Meeting ID or Audio ID must be provided');
    return NextResponse.json(
      {
        error: 'Meeting ID 또는 Audio ID가 제공되지 않았습니다.',
      },
      { status: 400 }
    );
  }

  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

  if (!bucketName) {
    console.error('GOOGLE_CLOUD_STORAGE_BUCKET environment variable is not set.');
    return NextResponse.json(
      { error: 'Server configuration error: GCS bucket name is missing.' },
      { status: 500 }
    );
  }

  try {
    let storageClient: Storage;

    try {
      storageClient = initializeStorageClient();
      console.log('Google Cloud Storage client initialized successfully');
    } catch (err) {
      console.error('Failed to initialize Google Cloud Storage client:', err);
      return NextResponse.json(
        { error: 'Server authentication failed. Please check Google Cloud credentials.' },
        { status: 500 }
      );
    }

    const bucket = storageClient.bucket(bucketName);
    let targetFile;

    if (audioId) {
      console.log(`Processing audioId: ${audioId}`);

      if (audioId.startsWith('gs://')) {
        const urlParts = audioId.replace('gs://', '').split('/');
        const bucketFromUrl = urlParts[0];
        const filePath = urlParts.slice(1).join('/');

        if (bucketFromUrl !== bucketName) {
          console.warn(`Bucket mismatch: expected ${bucketName}, got ${bucketFromUrl}`);
        }

        targetFile = bucket.file(filePath);
        console.log(`Target file from GCS URI: ${filePath}`);
      } else if (audioId.startsWith('https://')) {
        return NextResponse.json({
          audioUrl: audioId,
          fileName: 'external-audio',
          message: 'External URL provided directly',
        });
      } else {
        targetFile = bucket.file(audioId);
        console.log(`Target file from relative path: ${audioId}`);
      }

      const [exists] = await targetFile.exists();
      if (!exists) {
        console.log(`Audio file not found: ${audioId}`);
        return NextResponse.json(
          { error: '요청된 오디오 파일을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    } else {
      const [files] = await bucket.getFiles({
        prefix: `audios/meeting_${meetingId}_`,
      });

      if (files.length === 0) {
        console.log(`No audio files found for meeting ID: ${meetingId}`);
        return NextResponse.json(
          { error: '해당 회의의 오디오 파일을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      targetFile = files.sort((a, b) => b.name.localeCompare(a.name))[0];
    }

    console.log(`Processing audio file: ${targetFile.name}`);

    // 파일의 실제 메타데이터 먼저 가져오기
    const [metadata] = await targetFile.getMetadata();
    const contentType = metadata.contentType || 'audio/webm';

    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + 60 * 60 * 1000,
      responseType: contentType,
    };

    const [signedUrl] = await targetFile.getSignedUrl(options);

    console.log(`Generated signed URL for audio file: ${targetFile.name}`);

    return NextResponse.json({
      audioUrl: signedUrl,
      fileName: targetFile.name,
      fileSize: metadata.size,
      contentType: contentType,
      created: metadata.timeCreated,
      updated: metadata.updated,
    });
  } catch (error) {
    console.error('--- Error in GET /api/audio ---', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    return NextResponse.json(
      {
        error: '오디오 파일을 불러오는 중 서버 오류가 발생했습니다.',
        details: errorMessage,
        name: errorName,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('Audio API POST request received for Signed URL generation');

  try {
    const body = await request.json();
    const { meetingId, fileName, contentType } = body;

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID not provided.' }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: 'File name not provided.' }, { status: 400 });
    }

    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    if (!bucketName) {
      return NextResponse.json(
        { error: 'Server configuration error: GCS bucket name is missing.' },
        { status: 500 }
      );
    }

    const storageClient = initializeStorageClient();

    // 원본 확장자 유지
    const extension = fileName.split('.').pop() || 'webm';
    const timestamp = Date.now();
    const gcsFileName = `meeting_${meetingId}_${timestamp}.${extension}`;
    const gcsPath = `audios/${gcsFileName}`;

    const file = storageClient.bucket(bucketName).file(gcsPath);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 180 * 60 * 1000, // 180분 유효
      contentType: contentType || 'audio/webm',
    });

    console.log(`Generated signed upload URL for: gs://${bucketName}/${gcsPath}`);

    return NextResponse.json({
      uploadUrl,
      fileName: gcsFileName,
      gcsPath: `gs://${bucketName}/${gcsPath}`,
      audioId: `gs://${bucketName}/${gcsPath}`,
      message: 'Signed URL generated. Upload directly to GCS using PUT request.',
      success: true,
    });
  } catch (error) {
    console.error('--- Error in POST /api/audio ---', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    return NextResponse.json(
      {
        error: 'Signed URL 생성 중 오류가 발생했습니다.',
        details: errorMessage,
        name: errorName,
      },
      { status: 500 }
    );
  }
}
