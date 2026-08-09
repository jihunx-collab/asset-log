import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { putBinaryFile } from '@/lib/github';
import { slugify } from '@/lib/slugify';

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

// Vercel Serverless Functions cap request bodies around 4.5MB; keep well under
// that once base64 (~+33%) is added on top of the raw file size.
const MAX_FILE_BYTES = 3 * 1024 * 1024;

interface UploadRequest {
  filename: string;
  mimeType: string;
  base64: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
  }

  const payload = (await req.json()) as UploadRequest;
  const ext = ALLOWED_MIME_TO_EXT[payload.mimeType];
  if (!ext) {
    return NextResponse.json(
      { error: 'PNG, JPEG, GIF, WEBP 형식만 업로드할 수 있습니다.' },
      { status: 400 }
    );
  }

  const approxBytes = (payload.base64?.length ?? 0) * 0.75;
  if (approxBytes > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: '이미지가 너무 큽니다. 3MB 이하로 줄여서 다시 시도해주세요.' },
      { status: 400 }
    );
  }

  const baseName = slugify(payload.filename.replace(/\.[^.]+$/, '')) || 'image';
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const path = `public/uploads/${baseName}-${unique}.${ext}`;

  await putBinaryFile(path, payload.base64, `content: upload image ${baseName} via admin UI`);

  return NextResponse.json({ url: `/uploads/${baseName}-${unique}.${ext}` });
}
