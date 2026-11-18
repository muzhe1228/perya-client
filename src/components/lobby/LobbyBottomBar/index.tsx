import type { LobbyBottomBarProps } from "./types.ts";
import activityIcon from "@/assets/images/icon-activity.png";
import missionIcon from "@/assets/images/icon-mission.png";
import btnPlay from "@/assets/images/btn-play.png";
import "./index.scss";

export function LobbyBottomBar({ onActivity, onPlay, onMission }: LobbyBottomBarProps) {
  return (
    <nav className="lobby-bottom" aria-label="大厅主导航">
      <button type="button" className="lobby-bottom__side is-click" onClick={onActivity}>
        <img src={activityIcon} alt="Activity" />
      </button>
      <button type="button" className="lobby-bottom__play is-click" onClick={onPlay}>
        <img src={btnPlay} alt="Play" />
      </button>
      <button type="button" className="lobby-bottom__side is-click" onClick={onMission}>
        <img src={missionIcon} alt="Mission" />
      </button>
    </nav>
  );
}
