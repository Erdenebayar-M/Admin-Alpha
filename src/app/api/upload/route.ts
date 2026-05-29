import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

function getS3Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      `R2 credentials missing: accountId=${!!accountId}, accessKeyId=${!!accessKeyId}, secretAccessKey=${!!secretAccessKey}`
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

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

    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (!bucketName || !publicUrl) {
      return NextResponse.json(
        { success: false, error: 'R2 bucket or public URL not configured' },
        { status: 500 }
      );
    }

    const s3 = getS3Client();
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const fileName = `${type}s/${timestamp}-${random}${getExtension(type, file.type)}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `${publicUrl}/${fileName}`;
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
