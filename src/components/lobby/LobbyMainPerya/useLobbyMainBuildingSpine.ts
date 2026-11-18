import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { SpinePlayerHandle } from "@/components/SpinePlayer";
import { advanceLobbyBuildingIntro } from "@/lobby/buildingActivity.ts";
import { useLobbyStore } from "@/stores/useLobbyStore";
import {
  lobbyMainBuildingPlayback,
  type LobbyMainBuildingActivityState,
  type LobbyMainBuildingConfig,
} from "./constants.ts";

/** 建筑活动态 → Spine 播放；opening 结束由 onEnd 切 active */
export function useLobbyMainBuildingSpine(
  config: LobbyMainBuildingConfig,
  spineRef: RefObject<SpinePlayerHandle | null>,
) {
  const spineReady = useRef(false);
  const activity = useLobbyStore((s) => s.buildingActivity[config.id]);
  const setBuildingActivity = useLobbyStore((s) => s.setBuildingActivity);

  const playForState = useCallback(
    (state: LobbyMainBuildingActivityState) => {
      const { name, loop } = lobbyMainBuildingPlayback(state, config.anims);
      spineRef.current?.playAnimation(name, loop);
    },
    [config.anims, spineRef],
  );

  useEffect(() => {
    if (!spineReady.current) return;
    playForState(activity);
  }, [activity, playForState]);

  const onSpineLoaded = useCallback(() => {
    spineReady.current = true;
    const latest = useLobbyStore.getState().buildingActivity[config.id];
    playForState(latest);
  }, [config.id, playForState]);

  const onSpineEnd = useCallback(
    (animName: string) => {
      if (animName !== config.anims.eventUp) return;
      const latestActivity = useLobbyStore.getState().buildingActivity[config.id];
      if (latestActivity !== "opening") return;
      setBuildingActivity(config.id, "active");
      advanceLobbyBuildingIntro(config.id);
    },
    [config.anims.eventUp, config.id, setBuildingActivity],
  );

  return { onSpineLoaded, onSpineEnd, activityState: activity };
}