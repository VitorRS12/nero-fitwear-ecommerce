import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const SHOW_DELAY_MS = 120;

/**
 * Overlay de carregamento entre páginas.
 * Componente puro de apresentação: só observa o estado do roteador.
 */
export function RouteLoadingOverlay() {
  const isNavigating = useRouterState({
    select: (state) => state.isLoading || state.isTransitioning || state.status === "pending",
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isNavigating) {
      setVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [isNavigating]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-[2px]"
    >
      {/* linha de progresso indeterminada no topo */}
      <div className="absolute inset-x-0 top-0 h-px overflow-hidden bg-border">
        <div className="nero-progress h-px w-1/3 bg-foreground" />
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-30 w-30 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-border" />
          <span className="nero-orbit absolute inset-0 rounded-full border border-transparent border-t-foreground" />
          <img
            src="/brand/nero-mark-loading.png"
            alt=""
            aria-hidden
            className="nero-breathe h-34 w-34 object-contain"
          />
        </div>
        <span className="label-caps text-muted-foreground">Carregando</span>
      </div>
    </div>
  );
}
