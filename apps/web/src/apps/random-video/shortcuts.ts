const SHORTCUT_BLOCKED_SELECTOR =
  'input, textarea, select, [role="slider"], [contenteditable="true"]';

const TOUCH_NAVIGATION_BLOCKED_SELECTOR =
  'a, button, input, textarea, select, [role="slider"], [contenteditable="true"], [data-interactive]';

export const isShortcutBlocked = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  Boolean(target.closest(SHORTCUT_BLOCKED_SELECTOR));

export const isTouchNavigationBlocked = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  Boolean(target.closest(TOUCH_NAVIGATION_BLOCKED_SELECTOR));
