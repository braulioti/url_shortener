const DEFAULT_THEME_COLOR = "#0f1f3e";
const DEFAULT_DISPLAY_NAME = "Vortius";

function expandShortHex(hex: string): string {
  const value = hex.slice(1);
  return `#${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`.toLowerCase();
}

export function parseThemeColor(value: string | undefined): string {
  if (!value?.trim()) {
    return DEFAULT_THEME_COLOR;
  }

  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return expandShortHex(trimmed);
  }

  return DEFAULT_THEME_COLOR;
}

export function resolveDisplayName(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : DEFAULT_DISPLAY_NAME;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = parseThemeColor(hex);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function mixRgb(
  base: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  weight: number,
): { r: number; g: number; b: number } {
  return {
    r: Math.round(base.r + (target.r - base.r) * weight),
    g: Math.round(base.g + (target.g - base.g) * weight),
    b: Math.round(base.b + (target.b - base.b) * weight),
  };
}

export function buildThemeStyle(themeColor: string): string {
  const brand = parseThemeColor(themeColor);
  const brandRgb = hexToRgb(brand);
  const elevatedMix = mixRgb(brandRgb, { r: 255, g: 255, b: 255 }, 0.12);
  const accentMix = mixRgb(brandRgb, { r: 91, g: 141, b: 239 }, 0.65);
  const accent = rgbToHex(accentMix.r, accentMix.g, accentMix.b);
  const accentStrongMix = mixRgb(hexToRgb(accent), { r: 0, g: 0, b: 0 }, 0.15);
  const elevated = rgbToHex(elevatedMix.r, elevatedMix.g, elevatedMix.b);
  const accentStrong = rgbToHex(
    accentStrongMix.r,
    accentStrongMix.g,
    accentStrongMix.b,
  );

  return `:root {
  --brand: ${brand};
  --bg-deep: ${brand};
  --bg-elevated: ${elevated};
  --accent: ${accent};
  --accent-strong: ${accentStrong};
}`;
}
