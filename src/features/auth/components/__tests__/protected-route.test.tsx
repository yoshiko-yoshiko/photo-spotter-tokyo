import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoute } from '../protected-route';

const mockUseAuth = vi.fn();
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../auth-prompt-modal', () => ({
  AuthPromptModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="auth-modal">
        <button onClick={onClose}>close</button>
      </div>
    ) : null,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({ loading: true, isGuest: false, user: null });

    const { container } = render(
      <ProtectedRoute>
        <div>child content</div>
      </ProtectedRoute>
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('child content')).not.toBeInTheDocument();
  });

  it('shows login prompt when user is null', () => {
    mockUseAuth.mockReturnValue({ loading: false, isGuest: false, user: null });

    render(
      <ProtectedRoute>
        <div>child content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('この機能を使うにはログインが必要です')).toBeInTheDocument();
    expect(screen.getByText('ログインする')).toBeInTheDocument();
    expect(screen.queryByText('child content')).not.toBeInTheDocument();
  });

  it('shows login prompt when user is guest', () => {
    mockUseAuth.mockReturnValue({ loading: false, isGuest: true, user: { id: '1' } });

    render(
      <ProtectedRoute>
        <div>child content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('この機能を使うにはログインが必要です')).toBeInTheDocument();
    expect(screen.queryByText('child content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ loading: false, isGuest: false, user: { id: '1' } });

    render(
      <ProtectedRoute>
        <div>child content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('opens auth modal when login button is clicked', () => {
    mockUseAuth.mockReturnValue({ loading: false, isGuest: false, user: null });

    render(
      <ProtectedRoute>
        <div>child content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('ログインする'));

    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
  });
});
