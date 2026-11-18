import { useState } from "react";
import {
  LOBBY_MAIN_BUILDING_COLORS,
  type LobbyMainBuildingActivityState,
  type LobbyMainBuildingId,
} from "./constants.ts";
import {
  getLobbyBuildingActivity,
  resetLobbyBuildingActivity,
  setLobbyBuildingActivity,
} from "@/lobby/buildingActivity.ts";
import { useLobbyStore } from "@/stores/useLobbyStore";
import "./LobbyBuildingActivityDevPanel.scss";

const BUILDING_IDS: LobbyMainBuildingId[] = ["cg", "db", "ht", "pp"];

const ACTIVITY_OPTIONS: { state: LobbyMainBuildingActivityState; label: string }[] = [
  { state: "idle", label: "idle 常态" },
  { state: "opening", label: "opening up→loop" },
  { state: "active", label: "active loop" },
  { state: "linking", label: "linking loop" },
];

/** 仅 DEV：手动切换建筑 Spine 活动态 */
export function LobbyBuildingActivityDevPanel() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<LobbyMainBuildingId>("cg");
  const buildingActivity = useLobbyStore((s) => s.buildingActivity);

  if (!import.meta.env.DEV) return null;

  const apply = (state: LobbyMainBuildingActivityState) => {
    setLobbyBuildingActivity(target, state);
  };

  return (
    <div className={`lobby-building-activity-dev${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="lobby-building-activity-dev__toggle is-click"
        onClick={() => setOpen((v) => !v)}
      >
        建筑动效
      </button>

      {open ? (
        <div className="lobby-building-activity-dev__panel" role="dialog" aria-label="建筑动效调试">
          <p className="lobby-building-activity-dev__hint">
            控制台：<code>lobbyBuilding.open(&apos;cg&apos;)</code>
          </p>

          <div className="lobby-building-activity-dev__targets">
            {BUILDING_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={`lobby-building-activity-dev__target is-click${target === id ? " is-active" : ""}`}
                onClick={() => setTarget(id)}
              >
                {LOBBY_MAIN_BUILDING_COLORS[id]} {id}
                <span className="lobby-building-activity-dev__state-tag">{buildingActivity[id]}</span>
              </button>
            ))}
          </div>

          <div className="lobby-building-activity-dev__actions">
            {ACTIVITY_OPTIONS.map(({ state, label }) => (
              <button
                key={state}
                type="button"
                className="lobby-building-activity-dev__action is-click"
                onClick={() => apply(state)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="lobby-building-activity-dev__footer">
            <button
              type="button"
              className="lobby-building-activity-dev__action is-click lobby-building-activity-dev__action--ghost"
              onClick={() => resetLobbyBuildingActivity()}
            >
              全部 idle
            </button>
            <button
              type="button"
              className="lobby-building-activity-dev__action is-click lobby-building-activity-dev__action--ghost"
              onClick={() => {
                if (import.meta.env.DEV) console.log("[lobbyBuilding]", getLobbyBuildingActivity());
              }}
            >
              打印状态
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}