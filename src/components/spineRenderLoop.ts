/** 约束 spine-player rAF 渲染链，避免 visibility 切换后叠多帧 */
export function bindSpineRenderLoop(
  player: {
    drawFrame: (continueAfter?: boolean) => void;
    startRendering: () => void;
    stopRendering: () => void;
    stopRequestAnimationFrame?: boolean;
    disposed?: boolean;
  },
  fps?: number,
) {
  const spine = player;
  const drawFrame = spine.drawFrame.bind(spine);
  const minGap = fps && fps > 0 ? 1000 / fps : 0;
  let epoch = 0;
  let ticket = 0;
  let lastDrawAt = 0;

  const schedule = (gen: number) => {
    if (gen !== epoch || spine.disposed) return;
    const next = ++ticket;
    requestAnimationFrame(() => {
      if (next !== ticket || gen !== epoch || spine.disposed || spine.stopRequestAnimationFrame) return;
      spine.drawFrame(true);
    });
  };

  spine.drawFrame = (continueAfter = true) => {
    if (!continueAfter) {
      if (spine.disposed || spine.stopRequestAnimationFrame) return;
      drawFrame(false);
      return;
    }
    if (spine.stopRequestAnimationFrame || spine.disposed) return;
    const gen = epoch;
    const now = performance.now();
    if (minGap <= 0 || now - lastDrawAt >= minGap) {
      lastDrawAt = now;
      spine.stopRequestAnimationFrame = true;
      try {
        drawFrame(true);
      } finally {
        if (gen === epoch) spine.stopRequestAnimationFrame = false;
      }
    }
    if (gen === epoch) schedule(gen);
  };

  spine.stopRendering = () => {
    epoch++;
    ticket++;
    spine.stopRequestAnimationFrame = true;
  };

  spine.startRendering = () => {
    const gen = ++epoch;
    spine.stopRequestAnimationFrame = false;
    schedule(gen);
  };
}
