import actCg from "@/assets/images/avtivity/act-cg.png";
import actDb from "@/assets/images/avtivity/act-db.png";
import actPp from "@/assets/images/avtivity/act-pp.png";
import btnClaim from "@/assets/images/avtivity/btn-claim.png";
import btnComingSoon from "@/assets/images/avtivity/btn-comingSoon.png";
import btnCompleted from "@/assets/images/avtivity/btn-completed.png";
import btnEventEnded from "@/assets/images/avtivity/btn-eventended.png";
import btnFreeplay from "@/assets/images/avtivity/btn-freeplay.png";
import btnPlaynow from "@/assets/images/avtivity/btn-playnow.png";
import logoCg from "@/assets/images/avtivity/logo-bg.png";
import logoDb from "@/assets/images/avtivity/logo-db.png";
import logoPp from "@/assets/images/avtivity/logo-pp.png";

export type LobbyActivityTheme = "blue" | "green" | "green1" | "pink" | "glod";

export type LobbyActivityAction =
  | "comingSoon"
  | "completed"
  | "claim"
  | "playNow"
  | "freePlay"
  | "eventEnded";

export interface LobbyActivityItem {
  id: string;
  title: string;
  dateRange: string;
  hero: string;
  logo: string;
  theme: LobbyActivityTheme;
  action: LobbyActivityAction;
}

export const LOBBY_ACTIVITY_ACTION_IMG: Record<LobbyActivityAction, string> = {
  comingSoon: btnComingSoon,
  completed: btnCompleted,
  claim: btnClaim,
  playNow: btnPlaynow,
  freePlay: btnFreeplay,
  eventEnded: btnEventEnded,
};

/** 活动列表占位（后续接 API） */
export const LOBBY_ACTIVITY_ITEMS: readonly LobbyActivityItem[] = [
  {
    id: "db-drop-ball",
    title: "Drop Ball",
    dateRange: "2026/12/10 ~ 2027/03/21",
    hero: actDb,
    logo: logoDb,
    theme: "blue",
    action: "comingSoon",
  },
  {
    id: "cg-color-game",
    title: "Color Game",
    dateRange: "2026/12/10 ~ 2027/03/21",
    hero: actCg,
    logo: logoCg,
    theme: "green",
    action: "completed",
  },
  {
    id: "pp-pula-puti",
    title: "Pula Puti",
    dateRange: "2026/12/10 ~ 2027/03/21",
    hero: actPp,
    logo: logoPp,
    theme: "pink",
    action: "claim",
  },
  {
    id: "db-drop-ball-2",
    title: "Drop Ball",
    dateRange: "2026/12/10 ~ 2027/03/21",
    hero: actDb,
    logo: logoDb,
    theme: "green1",
    action: "freePlay",
  },
  {
    id: "db-drop-ball-2",
    title: "Hantak",
    dateRange: "2026/12/10 ~ 2027/03/21",
    hero: actCg,
    logo: logoPp,
    theme: "glod",
    action: "playNow",
  },
  {
    id: "db-drop-ball-2",
    title: "Hantak",
    dateRange: "2026/12/10 ~ 2027/03/21",
    hero: actDb,
    logo: logoDb,
    theme: "blue",
    action: "eventEnded",
  },
];

export const LOBBY_ACTIVITY_TEXT_COLOR: Record<string, string> = {
  blue: "#0430C1",
  green: "#006B4F",
  green1: "#07717A",
  pink: "#A70059",
  glod: "#873616",
};