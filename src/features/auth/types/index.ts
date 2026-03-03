export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export interface AuthPromptModalProps {
  open: boolean;
  onClose: () => void;
}
