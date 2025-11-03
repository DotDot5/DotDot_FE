import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export const maxDuration = 60;

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

const storage = new Storage(getGoogleCredentials());

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ Authorization 헤더 없음 (개발 중에는 무시)');
    }

    const body = await req.json();
    const { gcsUris } = body;

    if (!Array.isArray(gcsUris) || gcsUris.length === 0) {
      console.warn('⚠️ 삭제할 URI 목록이 비어있음');
      return NextResponse.json(
        {
          message: 'No URIs provided for deletion.',
          deletedCount: 0,
          failedCount: 0,
          skippedCount: 0,
          results: [],
        },
        { status: 200 }
      );
    }

    const deletionPromises = gcsUris.map(async (uri: string) => {
      try {
        if (!uri.startsWith('gs://')) {
          console.warn(`⚠️ 잘못된 URI 형식: ${uri}`);
          return { uri, status: 'skipped', reason: 'Invalid URI format' };
        }

        const uriWithoutPrefix = uri.replace('gs://', '');
        const firstSlashIndex = uriWithoutPrefix.indexOf('/');

        if (firstSlashIndex === -1) {
          console.warn(`⚠️ URI에 파일 경로 없음: ${uri}`);
          return { uri, status: 'skipped', reason: 'No file path in URI' };
        }

        const bucketName = uriWithoutPrefix.substring(0, firstSlashIndex);
        const filePath = uriWithoutPrefix.substring(firstSlashIndex + 1);

        if (!bucketName || !filePath) {
          console.warn(`⚠️ URI 파싱 실패: ${uri}`);
          return { uri, status: 'skipped', reason: 'Failed to parse URI' };
        }

        await storage.bucket(bucketName).file(filePath).delete();

        return { uri, status: 'deleted' };
      } catch (error: any) {
        if (error.code === 404 || error.message?.includes('No such object')) {
          return { uri, status: 'already_deleted' };
        }

        console.error(`❌ 삭제 실패: ${uri} - ${error.message}`);
        return {
          uri,
          status: 'failed',
          error: error.message || 'Unknown error',
        };
      }
    });

    const results = await Promise.all(deletionPromises);

    const deletedCount = results.filter(
      (r) => r.status === 'deleted' || r.status === 'already_deleted'
    ).length;
    const failedCount = results.filter((r) => r.status === 'failed').length;
    const skippedCount = results.filter((r) => r.status === 'skipped').length;
    const failedDeletions = results.filter((r) => r.status === 'failed');
    if (failedDeletions.length > 0) {
      console.warn('⚠️ 삭제 실패 목록:', failedDeletions);
    }

    return NextResponse.json({
      success: failedCount === 0,
      message: `Deletion completed. Total: ${gcsUris.length}, Deleted: ${deletedCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`,
      deletedCount,
      failedCount,
      skippedCount,
      totalCount: gcsUris.length,
      results,
    });
  } catch (error: any) {
    console.error('❌ 청크 삭제 API 에러:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during deletion process.',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
