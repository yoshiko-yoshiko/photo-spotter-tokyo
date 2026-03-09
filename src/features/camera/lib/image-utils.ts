import { toast } from 'sonner';
import { LIMITS } from '@/lib/constants';

export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_DIMENSION: 4096,
  MAX_WIDTH: parseInt(import.meta.env.VITE_IMAGE_MAX_WIDTH || '1920'),
  JPEG_QUALITY: parseFloat(import.meta.env.VITE_IMAGE_QUALITY || '0.8'),
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const,
  CAPTION_MAX_LENGTH: LIMITS.CAPTION_MAX,
  CAPTION_WARN_THRESHOLD: LIMITS.CAPTION_WARN_THRESHOLD,
} as const;

export async function validateImage(file: File): Promise<boolean> {
  if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type as typeof IMAGE_CONFIG.ALLOWED_TYPES[number])) {
    toast.error('対応していないファイル形式です。JPEG, PNG, WebP, HEIC の写真を選択してください。');
    return false;
  }

  if (file.size > IMAGE_CONFIG.MAX_SIZE_BYTES) {
    toast.error(`画像サイズは${IMAGE_CONFIG.MAX_SIZE_MB}MB以下にしてください`);
    return false;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const tooLarge = bitmap.width > IMAGE_CONFIG.MAX_DIMENSION || bitmap.height > IMAGE_CONFIG.MAX_DIMENSION;
    bitmap.close();
    if (tooLarge) {
      toast.error('画像サイズが大きすぎます（最大4096x4096px）');
      return false;
    }
  } catch {
    toast.error('この画像ファイルは読み込めません。別の写真を選択してください。');
    return false;
  }

  return true;
}

export async function resizeImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  if (width <= IMAGE_CONFIG.MAX_WIDTH && height <= IMAGE_CONFIG.MAX_WIDTH) {
    bitmap.close();
    return file;
  }

  const scale = IMAGE_CONFIG.MAX_WIDTH / Math.max(width, height);
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, newW, newH);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image conversion failed'))),
      'image/jpeg',
      IMAGE_CONFIG.JPEG_QUALITY,
    )
  );

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
}
