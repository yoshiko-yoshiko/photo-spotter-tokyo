import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IMAGE_CONFIG, validateImage, resizeImage } from './image-utils';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('IMAGE_CONFIG', () => {
  it('has correct max size in bytes', () => {
    expect(IMAGE_CONFIG.MAX_SIZE_BYTES).toBe(IMAGE_CONFIG.MAX_SIZE_MB * 1024 * 1024);
  });

  it('allows jpeg, png, webp, heic', () => {
    expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain('image/jpeg');
    expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain('image/png');
    expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain('image/webp');
    expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain('image/heic');
  });

  it('max dimension is 4096', () => {
    expect(IMAGE_CONFIG.MAX_DIMENSION).toBe(4096);
  });

  // --- QA追加 ---
  it('does not allow image/gif', () => {
    expect(IMAGE_CONFIG.ALLOWED_TYPES).not.toContain('image/gif');
  });

  it('does not allow image/bmp', () => {
    expect(IMAGE_CONFIG.ALLOWED_TYPES).not.toContain('image/bmp');
  });

  it('MAX_WIDTH and JPEG_QUALITY have sensible defaults', () => {
    expect(IMAGE_CONFIG.MAX_WIDTH).toBeGreaterThan(0);
    expect(IMAGE_CONFIG.JPEG_QUALITY).toBeGreaterThan(0);
    expect(IMAGE_CONFIG.JPEG_QUALITY).toBeLessThanOrEqual(1);
  });
});

describe('validateImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('rejects unsupported file types', async () => {
    const file = new File(['data'], 'test.bmp', { type: 'image/bmp' });
    const result = await validateImage(file);
    expect(result).toBe(false);
  });

  it('shows correct toast for unsupported file type', async () => {
    const file = new File(['data'], 'test.gif', { type: 'image/gif' });
    await validateImage(file);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('対応していないファイル形式です')
    );
  });

  it('rejects files exceeding max size', async () => {
    const bigBuffer = new ArrayBuffer(IMAGE_CONFIG.MAX_SIZE_BYTES + 1);
    const file = new File([bigBuffer], 'big.jpg', { type: 'image/jpeg' });
    const result = await validateImage(file);
    expect(result).toBe(false);
  });

  it('shows correct toast for oversized file', async () => {
    const bigBuffer = new ArrayBuffer(IMAGE_CONFIG.MAX_SIZE_BYTES + 1);
    const file = new File([bigBuffer], 'big.jpg', { type: 'image/jpeg' });
    await validateImage(file);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining(`${IMAGE_CONFIG.MAX_SIZE_MB}MB`)
    );
  });

  it('accepts a valid jpeg with normal dimensions', async () => {
    const file = new File(['fake'], 'valid.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      close: vi.fn(),
    }));
    const result = await validateImage(file);
    expect(result).toBe(true);
  });

  it('rejects images exceeding max dimension', async () => {
    const file = new File(['fake'], 'huge.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 5000,
      height: 3000,
      close: vi.fn(),
    }));
    const result = await validateImage(file);
    expect(result).toBe(false);
  });

  it('rejects when createImageBitmap fails', async () => {
    const file = new File(['corrupt'], 'bad.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode error')));
    const result = await validateImage(file);
    expect(result).toBe(false);
  });

  // --- QA追加: 境界値 ---
  it('accepts file at exactly max size (boundary)', async () => {
    const buffer = new ArrayBuffer(IMAGE_CONFIG.MAX_SIZE_BYTES);
    const file = new File([buffer], 'exact.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      close: vi.fn(),
    }));
    const result = await validateImage(file);
    expect(result).toBe(true);
  });

  it('accepts image at exactly max dimension (4096x4096)', async () => {
    const file = new File(['fake'], 'edge.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 4096,
      height: 4096,
      close: vi.fn(),
    }));
    const result = await validateImage(file);
    expect(result).toBe(true);
  });

  it('rejects when only width exceeds max dimension', async () => {
    const file = new File(['fake'], 'wide.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 4097,
      height: 1080,
      close: vi.fn(),
    }));
    const result = await validateImage(file);
    expect(result).toBe(false);
  });

  it('rejects when only height exceeds max dimension', async () => {
    const file = new File(['fake'], 'tall.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 1080,
      height: 4097,
      close: vi.fn(),
    }));
    const result = await validateImage(file);
    expect(result).toBe(false);
  });

  it('shows toast when createImageBitmap fails', async () => {
    const file = new File(['corrupt'], 'bad.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('fail')));
    await validateImage(file);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('読み込めません')
    );
  });

  it('accepts valid webp file', async () => {
    const file = new File(['fake'], 'photo.webp', { type: 'image/webp' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 800,
      height: 600,
      close: vi.fn(),
    }));
    const result = await validateImage(file);
    expect(result).toBe(true);
  });

  it('accepts valid png file', async () => {
    const file = new File(['fake'], 'photo.png', { type: 'image/png' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 800,
      height: 600,
      close: vi.fn(),
    }));
    const result = await validateImage(file);
    expect(result).toBe(true);
  });

  it('calls bitmap.close() even when dimension check fails', async () => {
    const closeFn = vi.fn();
    const file = new File(['fake'], 'big.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 5000,
      height: 5000,
      close: closeFn,
    }));
    await validateImage(file);
    expect(closeFn).toHaveBeenCalled();
  });
});

describe('resizeImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('returns original file if dimensions are within limit', async () => {
    const file = new File(['small'], 'small.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 800,
      height: 600,
      close: vi.fn(),
    }));
    const result = await resizeImage(file);
    expect(result).toBe(file);
  });

  it('resizes a large image and returns jpeg', async () => {
    const file = new File(['large'], 'large.png', { type: 'image/png' });

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 3000,
      height: 2000,
      close: vi.fn(),
    }));

    const mockCtx = { drawImage: vi.fn() };
    const mockBlob = new Blob(['resized'], { type: 'image/jpeg' });
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

    const result = await resizeImage(file);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('large.jpg');
    expect(mockCtx.drawImage).toHaveBeenCalled();
  });

  // --- QA追加: エッジケース ---
  it('resizes tall portrait image (height > width)', async () => {
    const file = new File(['tall'], 'portrait.jpg', { type: 'image/jpeg' });

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 1500,
      height: 3000,
      close: vi.fn(),
    }));

    const mockCtx = { drawImage: vi.fn() };
    const mockBlob = new Blob(['resized'], { type: 'image/jpeg' });
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

    const result = await resizeImage(file);
    expect(result.type).toBe('image/jpeg');
    // Scale = MAX_WIDTH / 3000, canvas should be set to scaled dimensions
    const expectedScale = IMAGE_CONFIG.MAX_WIDTH / 3000;
    expect(mockCanvas.width).toBe(Math.round(1500 * expectedScale));
    expect(mockCanvas.height).toBe(Math.round(3000 * expectedScale));
  });

  it('throws when canvas getContext returns null', async () => {
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 3000,
      height: 2000,
      close: vi.fn(),
    }));

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(null),
      toBlob: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

    await expect(resizeImage(file)).rejects.toThrow('Canvas 2D context unavailable');
  });

  it('rejects when toBlob returns null', async () => {
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 3000,
      height: 2000,
      close: vi.fn(),
    }));

    const mockCtx = { drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(null)),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

    await expect(resizeImage(file)).rejects.toThrow('Image conversion failed');
  });

  it('converts .webp extension to .jpg in output filename', async () => {
    const file = new File(['data'], 'photo.webp', { type: 'image/webp' });

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 3000,
      height: 2000,
      close: vi.fn(),
    }));

    const mockCtx = { drawImage: vi.fn() };
    const mockBlob = new Blob(['resized'], { type: 'image/jpeg' });
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

    const result = await resizeImage(file);
    expect(result.name).toBe('photo.jpg');
  });

  it('returns original file when exactly at MAX_WIDTH', async () => {
    const file = new File(['data'], 'exact.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: IMAGE_CONFIG.MAX_WIDTH,
      height: IMAGE_CONFIG.MAX_WIDTH,
      close: vi.fn(),
    }));
    const result = await resizeImage(file);
    expect(result).toBe(file);
  });

  it('calls bitmap.close() after resize', async () => {
    const closeFn = vi.fn();
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 3000,
      height: 2000,
      close: closeFn,
    }));

    const mockCtx = { drawImage: vi.fn() };
    const mockBlob = new Blob(['resized'], { type: 'image/jpeg' });
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

    await resizeImage(file);
    expect(closeFn).toHaveBeenCalled();
  });
});
