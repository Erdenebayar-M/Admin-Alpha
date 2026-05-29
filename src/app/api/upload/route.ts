import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'image' | 'audio';

    if (!file || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing file or type' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const fileName = `${type}s/${timestamp}-${random}${getExtension(type, file.type)}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;
    const base64 = buffer.toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        url,
        base64,
        fileName,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      },
      { status: 500 }
    );
  }
}

function getExtension(type: 'image' | 'audio', mimeType: string): string {
  if (type === 'image') {
    if (mimeType.includes('png')) return '.png';
    if (mimeType.includes('webp')) return '.webp';
    return '.jpg';
  }
  if (mimeType.includes('mp3')) return '.mp3';
  if (mimeType.includes('wav')) return '.wav';
  return '.m4a';
}
