import { useEffect, useLayoutEffect } from "react";
import { LobbyBanner } from "@/components/lobby/LobbyBanner";
import { LobbyJackpot } from "@/components/lobby/LobbyJackpot";
import { LobbyBuildingActivityDevPanel } from "@/components/lobby/LobbyMainPerya/LobbyBuildingActivityDevPanel.tsx";
import { LobbyMainPerya } from "@/components/lobby/LobbyMainPerya";
import { LobbyTipsBar } from "@/components/lobby/LobbyTipsBar";
import { attachLobbyBuildingDevTools, startLobbyBuildingIntro } from "@/lobby/buildingActivity.ts";
import "./index.scss";

export function LobbyMapPage() {
  useLayoutEffect(() => {
    startLobbyBuildingIntro();
  }, []);

  useEffect(() => {
    attachLobbyBuildingDevTools();
  }, []);

  return (
    <div className="lobby-map-page">
      <LobbyJackpot />
      <LobbyBanner />
      <LobbyTipsBar />
      <LobbyMainPerya />
      <LobbyBuildingActivityDevPanel />
    </div>
  );
}