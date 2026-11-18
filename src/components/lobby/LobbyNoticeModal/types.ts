export type LobbyNoticeVariant = "activity" | "load-failure";

export interface LobbyNoticeModalProps {
  open: boolean;
  variant: LobbyNoticeVariant;
  onClose: () => void;
  onRetry: () => void;
}