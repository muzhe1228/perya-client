import { useCallback, useRef } from "react";
import { LOBBY_BUILDING_VIDEO_SRC } from "@/config/lobbyBuildingVideos.ts";
import { SpinePlayer, type SpinePlayerHandle } from "@/components/SpinePlayer";
import {
  LOBBY_MAIN_BUILDING_ENTER,
  LOBBY_MAIN_BUILDINGS,
  type LobbyMainBuildingConfig,
} from "./constants.ts";
import { useLobbyMainBuildingSpine } from "./useLobbyMainBuildingSpine.ts";
import "./index.scss";

type BonePos = { x: number; y: number; rotation: number };

function LobbyMainBuildingVideo({
  pos,
  src,
}: {
  pos: BonePos;
  config: LobbyMainBuildingConfig;
  src: string;
}) {

  return (
    <div
      className="lobby-main-perya__video"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
      }}
    >
      <video
        className="lobby-main-perya__video-el"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}

function LobbyMainBuilding({ config, cusClassName }: { config: LobbyMainBuildingConfig, cusClassName: string }) {
  const spineRef = useRef<SpinePlayerHandle>(null);
  const videoSrc = LOBBY_BUILDING_VIDEO_SRC[config.id];
  const { onSpineLoaded, onSpineEnd, activityState } = useLobbyMainBuildingSpine(config, spineRef);

  const renderVideoOnBone = useCallback(
    (bones: Record<string, BonePos>) => {
      const pos = bones[config.videoBone];
      if (!pos) return null;
      return <LobbyMainBuildingVideo pos={pos} config={config} src={videoSrc} />;
    },
    [config, videoSrc],
  );

  const enter = LOBBY_MAIN_BUILDING_ENTER[config.id];

  return (
    <div
      className={`lobby-main-perya__building ${cusClassName}`}
      data-building={config.id}
      data-activity={activityState}
    >
      <SpinePlayer
        ref={spineRef}
        baseUrl={config.baseUrl}
        name={config.name}
        showOverlay={false}
        fullResolution
        trackBones={[config.videoBone]}
        overlays={renderVideoOnBone}
        onLoaded={onSpineLoaded}
        onEnd={onSpineEnd}
        onError={(err?: Error) => {
          if (import.meta.env.DEV) console.error(`[LobbyMainPerya:${config.id}]`, err);
        }}
      />
      <button
        type="button"
        className="lobby-main-perya__enter is-click"
        aria-label={enter.label}
        onClick={() => {
          if (import.meta.env.DEV) window.alert(`${enter.label} · 进房占位`);
        }}
      >
        <img src={enter.src} alt="" draggable={false} />
      </button>
    </div>
  );
}

/** 大厅地图四建筑（cg / db / ht / pp） */
export function LobbyMainPerya() {
  return (
    <div className="lobby-main-perya" aria-hidden>
      {LOBBY_MAIN_BUILDINGS.map((building) => (
        <LobbyMainBuilding key={building.id} cusClassName={building.id} config={building} />
      ))}
    </div>
  );
}