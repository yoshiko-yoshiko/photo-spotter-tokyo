import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthPromptModal } from '../auth-prompt-modal';

const { mockLinkGoogle, mockSignInWithGoogle, mockUseAuth, mockToastError } = vi.hoisted(() => ({
  mockLinkGoogle: vi.fn(),
  mockSignInWithGoogle: vi.fn(),
  mockUseAuth: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('sonner', () => ({
  toast: { error: mockToastError },
}));

describe('AuthPromptModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      linkGoogle: mockLinkGoogle,
      signInWithGoogle: mockSignInWithGoogle,
      isGuest: false,
    });
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

  // --- QA追加テスト ---

  it('calls linkGoogle instead of signInWithGoogle when user is guest', async () => {
    mockUseAuth.mockReturnValue({
      linkGoogle: mockLinkGoogle,
      signInWithGoogle: mockSignInWithGoogle,
      isGuest: true,
    });
    mockLinkGoogle.mockResolvedValue(undefined);

    render(<AuthPromptModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('Googleでログイン'));
    expect(mockLinkGoogle).toHaveBeenCalledTimes(1);
    expect(mockSignInWithGoogle).not.toHaveBeenCalled();
  });

  it('shows toast error when signInWithGoogle fails', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('auth failed'));

    render(<AuthPromptModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('Googleでログイン'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('ログインに失敗しました。もう一度お試しください。');
    });
  });

  it('shows toast error when linkGoogle fails for guest user', async () => {
    mockUseAuth.mockReturnValue({
      linkGoogle: mockLinkGoogle,
      signInWithGoogle: mockSignInWithGoogle,
      isGuest: true,
    });
    mockLinkGoogle.mockRejectedValue(new Error('link failed'));

    render(<AuthPromptModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('Googleでログイン'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('ログインに失敗しました。もう一度お試しください。');
    });
  });
});
