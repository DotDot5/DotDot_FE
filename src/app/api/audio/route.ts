import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export const dynamic = 'force-dynamic';

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
      storageClient = new Storage();
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

    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + 60 * 60 * 1000,
      responseType: 'audio/webm',
    };

    const [signedUrl] = await targetFile.getSignedUrl(options);

    console.log(`Generated signed URL for audio file: ${targetFile.name}`);

    const [metadata] = await targetFile.getMetadata();

    return NextResponse.json({
      audioUrl: signedUrl,
      fileName: targetFile.name,
      fileSize: metadata.size,
      contentType: metadata.contentType || 'audio/webm',
      created: metadata.timeCreated,
      updated: metadata.updated,
    });
  } catch (error) {
    console.error('Error retrieving audio file:', error);
    return NextResponse.json(
      { error: '오디오 파일을 불러오는 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('Audio API POST request received for upload');

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;
    const meetingIdField = formData.get('meetingId');

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json({ error: 'Audio file not provided.' }, { status: 400 });
    }

    if (!meetingIdField) {
      return NextResponse.json({ error: 'Meeting ID not provided.' }, { status: 400 });
    }

    const meetingId = parseInt(meetingIdField.toString(), 10);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: 'Invalid Meeting ID.' }, { status: 400 });
    }

    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    if (!bucketName) {
      return NextResponse.json(
        { error: 'Server configuration error: GCS bucket name is missing.' },
        { status: 500 }
      );
    }

    const storageClient = new Storage();
    const audioBytes = Buffer.from(await audioFile.arrayBuffer());
    const fileName = `meeting_${meetingId}_${Date.now()}.webm`;
    const gcsPath = `audios/${fileName}`;

    const file = storageClient.bucket(bucketName).file(gcsPath);

    await file.save(audioBytes, {
      metadata: {
        contentType: 'audio/webm',
        metadata: {
          meetingId: meetingId.toString(),
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Audio file uploaded to GCS: gs://${bucketName}/${gcsPath}`);

    return NextResponse.json({
      message: '오디오 파일이 성공적으로 업로드되었습니다.',
      fileName: fileName,
      gcsPath: `gs://${bucketName}/${gcsPath}`,
      audioId: `gs://${bucketName}/${gcsPath}`,
      success: true,
    });
  } catch (error) {
    console.error('Error uploading audio file:', error);
    return NextResponse.json(
      { error: '오디오 파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
