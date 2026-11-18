import iconRule from "@/assets/images/avtivity/icon-rule.png";
import { GameStrokeText } from "@/components/game-ui";
import {
  LOBBY_ACTIVITY_ACTION_IMG,
  LOBBY_ACTIVITY_TEXT_COLOR,
  type LobbyActivityItem,
} from "@/data/lobbyActivityData";
import "./index.scss";

export function LobbyActivityCard({ item }: { item: LobbyActivityItem }) {
  const btnSrc = LOBBY_ACTIVITY_ACTION_IMG[item.action];
  const btnLabel =
    item.action === "comingSoon"
      ? "Coming Soon"
      : item.action === "completed"
        ? "Completed"
        : item.action === "claim"
          ? "Claim"
          : item.action === "playNow"
            ? "Play Now"
            : item.action === "freePlay"
              ? "Free Play"
              : "Event Ended";

  return (
    <article className={`lobby-activity-card ${item.theme}-card ${item.action === "eventEnded" ? "ended-card" : ""}`}>
      <div className="lobby-activity-card__banner">
        <img className="lobby-activity-card__hero" src={item.hero} alt="" draggable={false} />
        <img className="lobby-activity-card__logo" src={item.logo} alt="" draggable={false} />
        {item.action === "eventEnded" && <div className="lobby-activity-card__ended"/>}
        <button
          type="button"
          className="lobby-activity-card__rule is-click"
          aria-label={`${item.title} rules`}
          onClick={() => {
            if (import.meta.env.DEV) window.alert(`${item.title} · 规则说明占位`);
          }}
        >
          <img src={iconRule} alt="" draggable={false} />
        </button>
        <div className="lobby-activity-card__foot">
          <div className="lobby-activity-card__meta">
            <GameStrokeText
              className="lobby-activity-card__title"
              text={item.title}
              color="#fff"
              strokeColor={LOBBY_ACTIVITY_TEXT_COLOR[item.theme]}
              strokeWidth={4}
              shadow={`0px 3px 3px ${LOBBY_ACTIVITY_TEXT_COLOR[item.theme]}`}
            />
            <GameStrokeText
              className="lobby-activity-card__date"
              text={item.dateRange}
              color="#FFF1B0"
              strokeColor="#123a7a"
              strokeWidth={0}
              shadow="0px 1px 0px #00000040"
            />
          </div>
          <button
            type="button"
            className="lobby-activity-card__action is-click"
            aria-label={btnLabel}
            onClick={() => {
              if (import.meta.env.DEV) window.alert(`${item.title} · ${btnLabel} 占位`);
            }}
          >
            <img src={btnSrc} alt="" draggable={false} />
          </button>
        </div>
      </div>


    </article>
  );
}