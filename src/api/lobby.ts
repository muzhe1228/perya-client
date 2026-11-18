import { getReq } from "./http";
import { fetchLobbyJackpotMock } from "./lobby.mock";

/** GET /api/perya/lobby/jackpot — 大厅地图 JP 奖池（金额字符串，口径同 masskara §8.5） */
export const LOBBY_JACKPOT_PATH = "/api/perya/lobby/jackpot";

export interface LobbyJackpotDto {
  /** 奖池金额，如 `"9999999.0000"` */
  amount: string;
  /** 服务端更新时间（毫秒时间戳，可选） */
  updatedAt?: number;
}

/** `VITE_LOBBY_JP_MOCK=1` 时走内存模拟，不请求后端 */
export function isLobbyJackpotMockEnabled(): boolean {
  const flag = import.meta.env.VITE_LOBBY_JP_MOCK;
  return flag === "1" || flag === "true";
}

export function fetchLobbyJackpot(signal?: AbortSignal): Promise<LobbyJackpotDto> {
  if (isLobbyJackpotMockEnabled()) {
    return fetchLobbyJackpotMock(signal);
  }
  return getReq<LobbyJackpotDto>(LOBBY_JACKPOT_PATH, { signal });
}