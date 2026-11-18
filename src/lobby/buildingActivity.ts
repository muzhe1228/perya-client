import {
  LOBBY_MAIN_BUILDING_ACTIVITY_DEFAULT,
  LOBBY_MAIN_BUILDING_INTRO_ORDER,
  type LobbyMainBuildingActivityState,
  type LobbyMainBuildingId,
} from "@/components/lobby/LobbyMainPerya/constants.ts";
import { useLobbyStore } from "@/stores/useLobbyStore";

const BUILDING_IDS: LobbyMainBuildingId[] = ["cg", "db", "ht", "pp"];

/** 手动切换单栋建筑活动 Spine 态 */
export function setLobbyBuildingActivity(
  id: LobbyMainBuildingId,
  state: LobbyMainBuildingActivityState,
) {
  useLobbyStore.getState().setBuildingActivity(id, state);
}

/** 读取四栋建筑当前活动态 */
export function getLobbyBuildingActivity() {
  return useLobbyStore.getState().buildingActivity;
}

function stopLobbyBuildingIntroSeq() {
  useLobbyStore.setState({ buildingIntroSeqActive: false, buildingIntroSeqIndex: 0 });
}

/** 四栋一键回到 idle，并中止进厅序列 */
export function resetLobbyBuildingActivity() {
  stopLobbyBuildingIntroSeq();
  for (const id of BUILDING_IDS) {
    setLobbyBuildingActivity(id, "idle");
  }
}

/**
 * 进入大厅：按 INTRO_ORDER 逐个 opening（Event_up）→ active（Event_loop）；
 * 等候中的建筑保持 idle（normal）。
 */
export function startLobbyBuildingIntro() {
  const order = LOBBY_MAIN_BUILDING_INTRO_ORDER;
  const buildingActivity: Record<LobbyMainBuildingId, LobbyMainBuildingActivityState> = {
    ...LOBBY_MAIN_BUILDING_ACTIVITY_DEFAULT,
  };
  for (const id of order) {
    buildingActivity[id] = "idle";
  }
  buildingActivity[order[0]] = "opening";

  useLobbyStore.setState({
    buildingIntroSeqActive: true,
    buildingIntroSeqIndex: 0,
    buildingActivity,
  });
}

/** 单栋 Event_up 播完后推进下一个 opening（仅序列进行中且顺序匹配） */
export function advanceLobbyBuildingIntro(finishedId: LobbyMainBuildingId) {
  const { buildingIntroSeqActive, buildingIntroSeqIndex } = useLobbyStore.getState();
  if (!buildingIntroSeqActive) return;

  const order = LOBBY_MAIN_BUILDING_INTRO_ORDER;
  if (order[buildingIntroSeqIndex] !== finishedId) return;

  const nextIndex = buildingIntroSeqIndex + 1;
  if (nextIndex < order.length) {
    useLobbyStore.setState({ buildingIntroSeqIndex: nextIndex });
    setLobbyBuildingActivity(order[nextIndex], "opening");
    return;
  }

  stopLobbyBuildingIntroSeq();
}

declare global {
  interface Window {
    lobbyBuilding?: {
      set: typeof setLobbyBuildingActivity;
      get: typeof getLobbyBuildingActivity;
      reset: typeof resetLobbyBuildingActivity;
      intro: typeof startLobbyBuildingIntro;
      open: (id: LobbyMainBuildingId) => void;
      active: (id: LobbyMainBuildingId) => void;
      linking: (id: LobbyMainBuildingId) => void;
      idle: (id: LobbyMainBuildingId) => void;
    };
  }
}

/** 开发环境挂到 window.lobbyBuilding，控制台可手动调动效 */
export function attachLobbyBuildingDevTools() {
  if (!import.meta.env.DEV) return;

  window.lobbyBuilding = {
    set: setLobbyBuildingActivity,
    get: getLobbyBuildingActivity,
    reset: resetLobbyBuildingActivity,
    intro: startLobbyBuildingIntro,
    open: (id) => setLobbyBuildingActivity(id, "opening"),
    active: (id) => setLobbyBuildingActivity(id, "active"),
    linking: (id) => setLobbyBuildingActivity(id, "linking"),
    idle: (id) => setLobbyBuildingActivity(id, "idle"),
  };
}