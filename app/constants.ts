// Prefix for public/ asset URLs so they resolve correctly under GitHub
// Pages' basePath (see next.config.ts). Empty string locally.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const TIER_ROW_HEIGHT = 30;
export const TIER_ITEM_HEIGHT = 20;
export const TIER_LABEL_WIDTH_CLASS = 'w-40';

export const DEFAULT_ITEM_SIZE = 15;
export const MIN_ITEM_SIZE = 10;
export const MAX_ITEM_SIZE = 25;

export const DEFAULT_POPUP_DISPLAY_TIME_MS = 3000;
export const USER_NAME_FETCH_INTERVAL_MS = 50;

export const TIER_ROW_BG_COLOR = '#404040';
export const TIER_ROW_BG_COLOR_HOVER = '#505050';
