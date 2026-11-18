import { InfiniteList } from "@/components/InfiniteList";
import { LobbyActivityCard } from "@/components/lobby/LobbyActivityCard";
import { GameStrokeText } from "@/components/game-ui";
import { LOBBY_ACTIVITY_ITEMS } from "@/data/lobbyActivityData";
import { useCallback } from "react";
import "./index.scss";

/** 大厅 Activity 列表（设计稿 src/assets/images/avtivity/ui-page.png） */
export function LobbyActivityPage() {
  const sentinelRef = useCallback((_node: HTMLDivElement | null) => {}, []);

  return (
    <div className="lobby-activity-page">
      <header className="lobby-activity-page__head">
        <GameStrokeText
          className="lobby-activity-page__title"
          text="Activity"
          color="#fff"
          strokeWidth={0}
          shadow="0px 2px 0px #0193EFB2"
        />
      </header>

      <InfiniteList
        className="lobby-activity-page__scroll"
        loading={false}
        hasMore={false}
        empty={LOBBY_ACTIVITY_ITEMS.length === 0}
        sentinelRef={sentinelRef}
        gap={14}
        emptyNode="暂无活动"
      >
        {LOBBY_ACTIVITY_ITEMS.map((item) => (
          <LobbyActivityCard key={item.id} item={item} />
        ))}
      </InfiniteList>
    </div>
  );
}