/** 过滤 spine-player / WebGL 已知噪声错误，避免整页 ErrorBoundary 误杀 */
export function installSpineErrorGuard() {
  if (typeof window === "undefined") return;
  const w = window as { __spineErrorGuardInstalled?: boolean };
  if (w.__spineErrorGuardInstalled) return;
  w.__spineErrorGuardInstalled = true;

  const patterns = [
    /WebGL/i,
    /spine-player/i,
    /context lost/i,
    /Unable to compile/i,
  ];

  const swallow = (msg: string) => patterns.some((p) => p.test(msg));

  window.addEventListener(
    "error",
    (e) => {
      const msg = e.message || String(e.error ?? "");
      if (swallow(msg)) e.preventDefault();
    },
    true,
  );

  window.addEventListener("unhandledrejection", (e) => {
    const msg = e.reason instanceof Error ? e.reason.message : String(e.reason ?? "");
    if (swallow(msg)) e.preventDefault();
  });
}
