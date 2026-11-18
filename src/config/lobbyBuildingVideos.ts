import type { LobbyMainBuildingId } from "@/components/lobby/LobbyMainPerya/constants.ts";
import cgVideo from "@/assets/video/cg.mp4";
import dbVideo from "@/assets/video/db.mp4";
import htVideo from "@/assets/video/ht.mp4";
import ppVideo from "@/assets/video/pp.mp4";

/** 大厅建筑循环预览（绿 cg / 蓝 db / 黄 ht / 粉 pp） */
export const LOBBY_BUILDING_VIDEO_SRC: Record<LobbyMainBuildingId, string> = {
  cg: cgVideo,
  db: dbVideo,
  ht: htVideo,
  pp: ppVideo,
};