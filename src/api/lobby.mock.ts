import { LOBBY_JP_PREVIEW_AMOUNT } from "@/data/lobbyData";
import { toApiMoney } from "@/utils/format";
import type { LobbyJackpotDto } from "./lobby";

let mockJackpot = LOBBY_JP_PREVIEW_AMOUNT;

/** 开发模拟：每次拉取在内存奖池上 +1～+100，便于看 MainNum 滚字 */
export function fetchLobbyJackpotMock(signal?: AbortSignal): Promise<LobbyJackpotDto> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }
  mockJackpot += 1 + Math.floor(Math.random() * 100);
  return Promise.resolve({
    amount: toApiMoney(mockJackpot),
    updatedAt: Date.now(),
  });
}

/** 热更新 / 重进大厅时恢复占位起点 */
export function resetLobbyJackpotMock(): void {
  mockJackpot = LOBBY_JP_PREVIEW_AMOUNT;
}