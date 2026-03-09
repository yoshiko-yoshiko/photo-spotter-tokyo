import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthPromptModal } from '../auth-prompt-modal';

const mockLinkGoogle = vi.fn();
const mockSignInWithGoogle = vi.fn();

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    linkGoogle: mockLinkGoogle,
    signInWithGoogle: mockSignInWithGoogle,
    isGuest: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('AuthPromptModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(<AuthPromptModal open={false} onClose={onClose} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal content when open is true', () => {
    render(<AuthPromptModal open={true} onClose={onClose} />);

    expect(screen.getByText('ログインして楽しもう！')).toBeInTheDocument();
    expect(screen.getByText(/写真を投稿してスタンプを集める/)).toBeInTheDocument();
    expect(screen.getByText('Googleでログイン')).toBeInTheDocument();
    expect(screen.getByText('あとで')).toBeInTheDocument();
  });

  it('calls onClose when "あとで" button is clicked', () => {
    render(<AuthPromptModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('あとで'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close (X) button is clicked', () => {
    render(<AuthPromptModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('閉じる'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls signInWithGoogle when not guest and login button is clicked', async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined);

    render(<AuthPromptModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('Googleでログイン'));
    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
  });
});
