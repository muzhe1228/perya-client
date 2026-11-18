import { useEffect } from "react";
import { fetchLobbyJackpot, isLobbyJackpotMockEnabled } from "@/api/lobby";
import { resetLobbyJackpotMock } from "@/api/lobby.mock";
import { LOBBY_JP_POLL_MS } from "@/components/lobby/LobbyJackpot/constants.ts";
import { useLobbyStore } from "@/stores/useLobbyStore";
import { quantMoney } from "@/utils/format";

/**
 * 大厅 JP 奖池与服务端对齐：轮询拉取，数值变化时 MainNum 滚字。
 * 后续 WebSocket 可在同一 store 上 `setJackpotAmount` / `patchLobbyJackpotFromServer`。
 */
export function useLobbyJackpotSync(): void {
  const setJackpotAmount = useLobbyStore((s) => s.setJackpotAmount);

  useEffect(() => {
    if (isLobbyJackpotMockEnabled()) {
      resetLobbyJackpotMock();
    }

    let disposed = false;
    let pollTimer = 0;
    const abort = new AbortController();

    const pull = async () => {
      if (disposed || document.hidden) return;
      try {
        const dto = await fetchLobbyJackpot(abort.signal);
        if (disposed) return;
        setJackpotAmount(quantMoney(dto.amount), dto.updatedAt);
      } catch (err) {
        if (disposed || abort.signal.aborted) return;
        if (import.meta.env.DEV) {
          console.warn("[useLobbyJackpotSync]", err);
        }
      }
    };

    void pull();
    pollTimer = window.setInterval(() => void pull(), LOBBY_JP_POLL_MS);

    const onVisible = () => {
      if (!document.hidden) void pull();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      disposed = true;
      abort.abort();
      window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [setJackpotAmount]);
}