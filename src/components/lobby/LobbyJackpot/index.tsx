import { useRef } from "react";
import { MainNum } from "@/components/RollingNumber";
import { SpinePlayer, type SpinePlayerHandle } from "@/components/SpinePlayer";
import { useLobbyStore } from "@/stores/useLobbyStore";
import { fmtPeso } from "@/utils/format";
import {
  // LOBBY_JP_NUM_BONE,
  LOBBY_JP_SPINE_ANIM,
  LOBBY_JP_SPINE_BASE,
  LOBBY_JP_SPINE_NAME,
} from "./constants.ts";
import "./index.scss";

// type BonePos = { x: number; y: number; rotation: number };

function LobbyJackpotAmount({ amount }: { amount: number }) {
  return (
    <div
      className="lobby-jackpot__num"
    >
      <MainNum
        value={fmtPeso(amount)}
        fontSize={11}
        maxWidth={80}
        animated
        rollPulse={false}
      />
    </div>
  );
}

/** 大厅地图右上角 Jackpot（PeryaLobby_jp 循环动画） */
export function LobbyJackpot() {
  const spineRef = useRef<SpinePlayerHandle>(null);
  const amount = useLobbyStore((s) => s.jackpotAmount);

  const handleLoaded = () => {
    spineRef.current?.playAnimation(LOBBY_JP_SPINE_ANIM, true);
  };

  // const renderJackpotAmount = (bones: Record<string, BonePos>) => {
  //   const pos = bones[LOBBY_JP_NUM_BONE];
  //   if (!pos) return null;
  //   return <LobbyJackpotAmount amount={amount} />;
  // };

  return (
    <div className="lobby-jackpot" aria-hidden>
      <LobbyJackpotAmount amount={amount} />
      <SpinePlayer
        ref={spineRef}
        baseUrl={LOBBY_JP_SPINE_BASE}
        name={LOBBY_JP_SPINE_NAME}
        showOverlay={false}
        fullResolution
        // trackBones={[LOBBY_JP_NUM_BONE]}
        // overlays={renderJackpotAmount}
        onLoaded={handleLoaded}
        onError={(err?: Error) => {
          if (import.meta.env.DEV) console.error("[LobbyJackpot]", err);
        }}
      />
    </div>
  );
}