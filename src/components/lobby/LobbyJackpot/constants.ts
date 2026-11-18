/** `public/spine/perya` — 大厅右上角 Jackpot 循环 Spine */
export const LOBBY_JP_SPINE_BASE = "/spine/jackpot";
export const LOBBY_JP_SPINE_NAME = "PeryaLobby_jp";
export const LOBBY_JP_SPINE_ANIM = "animation";
/** 金额文案跟随的骨骼挂点 */
export const LOBBY_JP_NUM_BONE = "num";
/** 奖池轮询间隔（毫秒）；可被 `VITE_LOBBY_JP_POLL_MS` 覆盖 */
export const LOBBY_JP_POLL_MS = Number(import.meta.env.VITE_LOBBY_JP_POLL_MS) || 5000;