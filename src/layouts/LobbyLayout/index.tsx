import activityBackIcon from "@/assets/images/avtivity/btn-back.png";
import lobbyMainBg from "@/assets/images/main-bg.jpg";
import playMapBg from "@/assets/images/play-map.png";
import lobbySubBg from "@/assets/images/sub-bg.jpg";
import { LobbyBottomBar } from "@/components/lobby/LobbyBottomBar";
import { LobbyHeader } from "@/components/lobby/LobbyHeader";
import { LobbyNoticeModal } from "@/components/lobby/LobbyNoticeModal";
import { useLobbyJackpotSync } from "@/hooks/useLobbyJackpotSync";
import { useLobbyStore } from "@/stores/useLobbyStore";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./index.scss";

function isLobbyMapRoute(pathname: string) {
  return pathname === "/" || pathname === "";
}

function isLobbyActivityRoute(pathname: string) {
  return pathname === "/activity" || pathname.endsWith("/activity");
}

/** 大厅壳：Header + 内容 + BottomBar */
export function LobbyLayout() {
  useLobbyJackpotSync();

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMap = isLobbyMapRoute(pathname);
  const isActivity = isLobbyActivityRoute(pathname);

  const noticeModalOpen = useLobbyStore((s) => s.noticeModalOpen);
  const setNoticeModalOpen = useLobbyStore((s) => s.setNoticeModalOpen);

  return (
    <div
      className={`lobby-page page-wrapper${
        isMap ? " lobby-page--map" : isActivity ? " lobby-page--activity lobby-page--no-bottom" : " lobby-page--inner"
      }`}
    >
      {isMap ? (
        <>
          <img className="lobby-page__map-bg" src={lobbyMainBg} alt="" draggable={false} aria-hidden />
          <img className="playMapBg" src={playMapBg} alt="" draggable={false} aria-hidden />
        </>
      ) : null}
      {isActivity ? (
        <img className="lobby-page__sub-bg" src={lobbySubBg} alt="" draggable={false} aria-hidden />
      ) : null}

      <LobbyHeader
        className={isActivity ? "lobby-header--activity-back" : undefined}
        backIcon={isActivity ? activityBackIcon : undefined}
        onHome={() => (isMap ? window.alert("返回 · 功能占位") : navigate("/"))}
        onAddBalance={() => window.alert("充值 · 功能占位")}
      />

      <main className="lobby-page__main">
        <Outlet />
      </main>

      {isActivity ? null : (
        <LobbyBottomBar
          onActivity={() => navigate("/activity")}
          onPlay={() => window.alert("PLAY · 功能占位")}
          onMission={() => window.alert("Mission · 功能占位")}
        />
      )}

      <LobbyNoticeModal
        open={noticeModalOpen}
        variant="load-failure"
        onClose={() => setNoticeModalOpen(false)}
        onRetry={() => setNoticeModalOpen(false)}
      />
    </div>
  );
}