import type { Appearance } from "@stripe/stripe-js";

/** Converte um token CSS (ex.: oklch) para rgb, que o Stripe aceita. */
function tokenToRgb(token: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!raw) return fallback;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallback;
  ctx.fillStyle = fallback;
  ctx.fillStyle = raw;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

/** Aparência do formulário do Stripe derivada dos tokens da loja. */
export function storeAppearance(): Appearance {
  const bg = tokenToRgb("--card", "rgb(19,19,19)");
  const input = tokenToRgb("--background", "rgb(10,10,10)");
  const fg = tokenToRgb("--foreground", "rgb(242,242,242)");
  const muted = tokenToRgb("--muted-foreground", "rgb(138,138,138)");
  const border = tokenToRgb("--border", "rgb(35,35,35)");
  const strong = tokenToRgb("--line-strong", "rgb(48,48,48)");
  const danger = tokenToRgb("--destructive", "rgb(220,220,220)");
  return {
    theme: "night",
    labels: "above",
    variables: {
      colorPrimary: fg,
      colorBackground: input,
      colorText: fg,
      colorTextSecondary: muted,
      colorTextPlaceholder: muted,
      colorDanger: danger,
      colorIcon: muted,
      borderRadius: "0px",
      fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif",
      fontSizeBase: "15px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": { border: `1px solid ${border}`, boxShadow: "none" },
      ".Input:focus": { border: `1px solid ${fg}`, boxShadow: "none" },
      ".Tab": { backgroundColor: bg, border: `1px solid ${border}`, boxShadow: "none" },
      ".Tab:hover": { border: `1px solid ${strong}` },
      ".Tab--selected": { border: `1px solid ${fg}`, boxShadow: "none" },
      ".Label": { textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "12px", color: muted },
    },
  };
}
