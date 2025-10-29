// src/app/api/split-audio/route.ts

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CLOUD_FUNCTION_URL = process.env.CLOUD_FUNCTION_SPLIT_AUDIO_URL || '';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gcsUri, meetingId, duration } = body;

    if (!gcsUri) {
      return NextResponse.json({ error: 'gcsUri is required' }, { status: 400 });
    }

    console.log(`🔗 Calling Cloud Function to split: ${gcsUri}`);

    // Cloud Function 호출
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gcsUri,
        chunkDuration: 300, // 👈 10분(600)에서 5분(300)으로 변경
        meetingId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloud Function error:', errorText);
      throw new Error(`Cloud Function failed: ${response.status}`);
    }

    const result = await response.json();
    if (!result || !Array.isArray(result.chunks)) {
      console.error('Cloud Function returned invalid JSON structure:', result);
      throw new Error('Cloud Function returned invalid structure (missing "chunks" array).');
    }
    console.log(`✅ Split completed: ${result.chunks.length} chunks`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Split audio API error:', error);
    return NextResponse.json(
      { error: `Failed to split audio: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
