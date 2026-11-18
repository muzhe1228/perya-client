import type { LobbyNoticeModalProps } from "./types.ts";
import { LOBBY_NOTICE } from "@/data/lobbyData";
import "./index.scss";

export function LobbyNoticeModal({ open, variant, onClose, onRetry }: LobbyNoticeModalProps) {
  if (!open) return null;

  const isLoadFailure = variant === "load-failure";

  return (
    <div
      className={`lobby-modal${isLoadFailure ? " lobby-modal--load-failure" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lobby-notice-title"
    >
      <button type="button" className="lobby-modal__backdrop is-click" aria-label="关闭" onClick={onClose} />
      <div className="lobby-modal__panel">
        <button type="button" className="lobby-modal__close is-click" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <h2 id="lobby-notice-title" className="lobby-modal__title">
          {isLoadFailure ? "Failed to load" : "Activity"}
        </h2>
        <p className="lobby-modal__body">
          {isLoadFailure ? "Please check your connection and try again." : LOBBY_NOTICE}
        </p>
        {isLoadFailure ? (
          <button type="button" className="lobby-modal__action is-click" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}