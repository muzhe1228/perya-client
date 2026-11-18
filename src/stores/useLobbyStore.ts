import { create } from "zustand";
import {
  LOBBY_MAIN_BUILDING_ACTIVITY_DEFAULT,
  type LobbyMainBuildingActivityState,
  type LobbyMainBuildingId,
} from "@/components/lobby/LobbyMainPerya/constants.ts";
import { LOBBY_JP_PREVIEW_AMOUNT } from "@/data/lobbyData";
import { quantMoney } from "@/utils/format";

interface LobbyState {
  bannerIndex: number;
  noticeModalOpen: boolean;
  /** 地图 JP 奖池；接口未返回前为占位预览值 */
  jackpotAmount: number;
  jackpotUpdatedAt: number | null;
  /** 四建筑活动 Spine 态（粉 PP / 黄 HT / 蓝 DB / 绿 CG） */
  buildingActivity: Record<LobbyMainBuildingId, LobbyMainBuildingActivityState>;
  /** 进厅逐个 up 序列是否进行中 */
  buildingIntroSeqActive: boolean;
  buildingIntroSeqIndex: number;
  setBannerIndex: (index: number) => void;
  setNoticeModalOpen: (open: boolean) => void;
  setBuildingActivity: (id: LobbyMainBuildingId, state: LobbyMainBuildingActivityState) => void;
  /** 轮询 / 推送写入；仅当金额变化时更新，便于 MainNum 滚字 */
  setJackpotAmount: (amount: number, updatedAt?: number) => void;
  /** 推送层便捷入口（金额字符串或 number） */
  patchLobbyJackpotFromServer: (amount: string | number, updatedAt?: number) => void;
}

export const useLobbyStore = create<LobbyState>((set, get) => ({
  bannerIndex: 0,
  noticeModalOpen: false,
  jackpotAmount: LOBBY_JP_PREVIEW_AMOUNT,
  jackpotUpdatedAt: null,
  buildingActivity: { ...LOBBY_MAIN_BUILDING_ACTIVITY_DEFAULT },
  buildingIntroSeqActive: false,
  buildingIntroSeqIndex: 0,
  setBannerIndex: (bannerIndex) => set({ bannerIndex }),
  setNoticeModalOpen: (noticeModalOpen) => set({ noticeModalOpen }),
  setBuildingActivity: (id, state) =>
    set((prev) => ({
      buildingActivity: { ...prev.buildingActivity, [id]: state },
    })),
  setJackpotAmount: (amount, updatedAt) => {
    if (!Number.isFinite(amount)) return;
    if (get().jackpotAmount === amount) {
      if (updatedAt != null) set({ jackpotUpdatedAt: updatedAt });
      return;
    }
    set({
      jackpotAmount: amount,
      jackpotUpdatedAt: updatedAt ?? Date.now(),
    });
  },
  patchLobbyJackpotFromServer: (raw, updatedAt) => {
    get().setJackpotAmount(quantMoney(raw), updatedAt);
  },
}));