import type { HomeForestSignViewport } from "./homeForestSignLayout";

export function parseHomeForestSignLayoutViewport(
  value: string | undefined,
): HomeForestSignViewport | null {
  if (value === "mobile" || value === "desktop") return value;
  return null;
}

export function parseHomeForestSignLayoutReturnTo(value: string | undefined): string | null {
  if (!value || !value.startsWith("/")) return null;
  return value;
}

export function buildHomeForestSignLayoutRulerHref(input?: {
  viewport?: HomeForestSignViewport;
  returnTo?: string;
  pin?: { x: number; y: number };
}): string {
  const params = new URLSearchParams();
  if (input?.viewport) params.set("viewport", input.viewport);
  if (input?.returnTo) params.set("returnTo", input.returnTo);
  if (input?.pin) {
    params.set("x", String(input.pin.x));
    params.set("y", String(input.pin.y));
  }
  const qs = params.toString();
  return `/preview/home-forest-sign/layout${qs ? `?${qs}` : ""}`;
}

export function parseHomeForestSignLayoutPin(input: {
  x?: string;
  y?: string;
}): { x: number; y: number } | null {
  const x = Number(input.x);
  const y = Number(input.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.round(x), y: Math.round(y) };
}
