import btnCg from "@/assets/images/btn-cg.png";
import btnDb from "@/assets/images/btn-db.png";
import btnHt from "@/assets/images/btn-ht.png";
import btnPp from "@/assets/images/btn-pp.png";
import type { CSSProperties } from "react";

/** 原合并主场景包围盒（用于四建筑对齐 play-map） */
export const LOBBY_MAIN_SCENE_BOUNDS = {
  x: -442.4078,
  y: -638.6224,
  width: 920.864,
  height: 1178.033,
} as const;

export type LobbyMainBuildingId = "cg" | "db" | "ht" | "pp";

/** 地图建筑下方入口（314×104 @3x 切图） */
export const LOBBY_MAIN_BUILDING_ENTER: Record<
  LobbyMainBuildingId,
  { src: string; label: string }
> = {
  cg: { src: btnCg, label: "Color Game" },
  db: { src: btnDb, label: "Drop Ball" },
  ht: { src: btnHt, label: "Hantak" },
  pp: { src: btnPp, label: "Pula Puti" },
};

/** 建筑配色：绿 CG · 蓝 DB · 黄 HT · 粉 PP */
export const LOBBY_MAIN_BUILDING_COLORS: Record<LobbyMainBuildingId, string> = {
  cg: "绿",
  db: "蓝",
  ht: "黄",
  pp: "粉",
};

/**
 * 大厅建筑 Spine 活动态（四色逻辑一致，仅前缀不同）
 *
 * 1. `idle` 無活動 — `PL_*_normal` 循環
 * 2. `opening` 開啟活動 — `PL_*_Event_up` 播一次，結束後進 `active`
 * 3. `active` 活動中 — `PL_*_Event_loop` 循環
 * 4. `linking` 連線中 — `PL_*_Event_loop` 循環
 */
export type LobbyMainBuildingActivityState = "idle" | "opening" | "active" | "linking";

export const LOBBY_MAIN_BUILDING_ACTIVITY_DEFAULT: Record<LobbyMainBuildingId, LobbyMainBuildingActivityState> =
  {
    cg: "idle",
    db: "idle",
    ht: "idle",
    pp: "idle",
  };

/** 进厅 stagger：自上而下 cg → pp → ht → db，依次 Event_up 后各自 Event_loop */
export const LOBBY_MAIN_BUILDING_INTRO_ORDER: readonly LobbyMainBuildingId[] = ["cg", "pp", "ht", "db"];

export interface LobbyMainBuildingAnims {
  normal: string;
  eventUp: string;
  eventLoop: string;
}

export interface LobbyMainBuildingConfig {
  id: LobbyMainBuildingId;
  baseUrl: string;
  name: string;
  anims: LobbyMainBuildingAnims;
  /** Spine 视频窗骨骼 */
  videoBone: string;
  /** Figma 视频窗尺寸（设计稿 px） */
  videoSize: { width: number; height: number };
  bounds: { x: number; y: number; width: number; height: number };
}

/** 四栋建筑独立 Spine（public/spine/{cg,db,ht,pp}） */
export const LOBBY_MAIN_BUILDINGS: readonly LobbyMainBuildingConfig[] = [
  {
    id: "cg",
    baseUrl: "/spine/cg",
    name: "PeryaLobby_cg",
    anims: {
      normal: "PL_CG_normal",
      eventUp: "PL_CG_Event_up",
      eventLoop: "PL_CG_Event_loop",
    },
    videoBone: "PL_CG_Video",
    videoSize: { width: 380, height: 500 },
    bounds: { x: -442.4078, y: 71.81628, width: 377.5776, height: 467.5943 },
  },
  {
    id: "db",
    baseUrl: "/spine/db",
    name: "PeryaLobby_db",
    anims: {
      normal: "PL_DB_Normal",
      eventUp: "PL_DB_Event_up",
      eventLoop: "PL_DB_Event_loop",
    },
    videoBone: "PL_DB_Video",
    videoSize: { width: 370, height: 500 },
    bounds: { x: 37.61159, y: -638.6224, width: 363.6555, height: 492.7308 },
  },
  {
    id: "ht",
    baseUrl: "/spine/ht",
    name: "PeryaLobby_ht",
    anims: {
      normal: "PL_HT_normal",
      eventUp: "PL_HT_Event_up",
      eventLoop: "PL_HT_Event_loop",
    },
    videoBone: "PL_HT_Video",
    videoSize: { width: 380, height: 500 },
    bounds: { x: -438.8371, y: -421.9171, width: 372.0816, height: 454.7927 },
  },
  {
    id: "pp",
    baseUrl: "/spine/pp",
    name: "PeryaLobby_pp",
    anims: {
      normal: "PL_PP_normal",
      eventUp: "PL_PP_Event_up",
      eventLoop: "PL_PP_Event_loop",
    },
    videoBone: "PL_PP_Video",
    videoSize: { width: 380, height: 500 },
    bounds: { x: 106.37453, y: -141.63828, width: 372.0816, height: 480.2429 },
  },
];

export function lobbyMainBuildingSceneStyle(bounds: LobbyMainBuildingConfig["bounds"]): CSSProperties {
  const { x: refX, y: refY, width: refW, height: refH } = LOBBY_MAIN_SCENE_BOUNDS;
  return {
    left: `${((bounds.x - refX) / refW) * 100}%`,
    bottom: `${((bounds.y - refY) / refH) * 100}%`,
    width: `${(bounds.width / refW) * 100}%`,
    height: `${(bounds.height / refH) * 100}%`,
  };
}

export function lobbyMainBuildingVideoBoxPercent(config: LobbyMainBuildingConfig): {
  width: string;
  height: string;
} {
  const { videoSize, bounds } = config;
  return {
    width: `${(videoSize.width / bounds.width) * 100}%`,
    height: `${(videoSize.height / bounds.height) * 100}%`,
  };
}

/** 按活动态选择应播动画与是否循环 */
export function lobbyMainBuildingPlayback(
  state: LobbyMainBuildingActivityState,
  anims: LobbyMainBuildingAnims,
): { name: string; loop: boolean } {
  switch (state) {
    case "idle":
      return { name: anims.normal, loop: true };
    case "opening":
      return { name: anims.eventUp, loop: false };
    case "active":
    case "linking":
      return { name: anims.eventLoop, loop: true };
    default:
      return { name: anims.normal, loop: true };
  }
}