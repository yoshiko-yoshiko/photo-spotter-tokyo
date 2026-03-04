import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateImage, resizeImage } from '@/features/camera/lib/image-utils';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

function makeFile(options: { type?: string; size?: number; name?: string } = {}) {
  const { type = 'image/jpeg', size = 1024, name = 'test.jpg' } = options;
  const buf = new ArrayBuffer(size);
  return new File([buf], name, { type });
}

beforeEach(() => {
  vi.restoreAllMocks();

  global.createImageBitmap = vi.fn().mockResolvedValue({
    width: 1000,
    height: 800,
    close: vi.fn(),
  });
});

describe('validateImage', () => {
  it('accepts valid MIME types (jpeg, png, webp)', async () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(await validateImage(makeFile({ type }))).toBe(true);
    }
  });

  it('rejects invalid MIME types', async () => {
    expect(await validateImage(makeFile({ type: 'application/pdf' }))).toBe(false);
    expect(await validateImage(makeFile({ type: 'text/plain' }))).toBe(false);
  });

  it('rejects files exceeding MAX_SIZE_BYTES', async () => {
    const oversized = makeFile({ size: 11 * 1024 * 1024 });
    expect(await validateImage(oversized)).toBe(false);
  });

  it('rejects images exceeding MAX_DIMENSION (4096px)', async () => {
    global.createImageBitmap = vi.fn().mockResolvedValue({
      width: 5000,
      height: 3000,
      close: vi.fn(),
    });
    expect(await validateImage(makeFile())).toBe(false);
  });

  it('rejects when createImageBitmap fails', async () => {
    global.createImageBitmap = vi.fn().mockRejectedValue(new Error('decode error'));
    expect(await validateImage(makeFile())).toBe(false);
  });
});

describe('resizeImage', () => {
  it('returns the original file if dimensions are within MAX_WIDTH', async () => {
    global.createImageBitmap = vi.fn().mockResolvedValue({
      width: 1000,
      height: 800,
      close: vi.fn(),
    });

    const file = makeFile({ name: 'small.jpg' });
    const result = await resizeImage(file);
    expect(result).toBe(file);
  });

  it('resizes images exceeding MAX_WIDTH', async () => {
    global.createImageBitmap = vi.fn().mockResolvedValue({
      width: 3000,
      height: 2000,
      close: vi.fn(),
    });

    const drawImage = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage,
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (this: HTMLCanvasElement, cb: BlobCallback) {
      cb(new Blob(['test'], { type: 'image/jpeg' }));
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    const file = makeFile({ name: 'large.png', type: 'image/png' });
    const result = await resizeImage(file);

    expect(result).not.toBe(file);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('large.jpg');
    expect(drawImage).toHaveBeenCalled();
  });

  it('produces output as a File (Blob)', async () => {
    global.createImageBitmap = vi.fn().mockResolvedValue({
      width: 4000,
      height: 2000,
      close: vi.fn(),
    });

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (this: HTMLCanvasElement, cb: BlobCallback) {
      cb(new Blob(['resized'], { type: 'image/jpeg' }));
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    const result = await resizeImage(makeFile({ name: 'big.png' }));
    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe('image/jpeg');
  });
});
