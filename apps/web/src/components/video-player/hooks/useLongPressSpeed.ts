import { useEffect, useState } from 'react';
import {
  isMediaPauseCapable,
  isMediaPlaybackRateCapable,
  useContainer,
  useMedia,
} from '@videojs/react';

export const CANCEL_LONG_PRESS_EVENT = 'velocity:cancel-long-press';

const LONG_PRESS_DELAY_MS = 450;
const TOUCH_LONG_PRESS_DELAY_MS = 550;
const MOVE_TOLERANCE_PX = 12;
const TOUCH_MOVE_TOLERANCE_PX = 8;

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(
    target.closest(
      'button, a, input, select, textarea, [role="button"], [role="slider"], [data-interactive]'
    )
  );

// Video.js's built-in seek gestures live on the same surface. On a phone in
// fullscreen landscape, a swipe/tap used for seeking would otherwise also
// start the long-press speed timer, so skip it in that one case.
const isTouchFullscreenLandscape = (event: PointerEvent) => {
  if (event.pointerType !== 'touch') return false;
  const fullscreenElement =
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null })
      .webkitFullscreenElement;
  return Boolean(fullscreenElement) && window.innerWidth > window.innerHeight;
};

export function useLongPressSpeed() {
  const container = useContainer();
  const media = useMedia();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!container || !isMediaPauseCapable(media)) return;

    let timer: number | undefined;
    let suppressClickTimer: number | undefined;
    let pointer:
      | { id: number; x: number; y: number; tolerance: number }
      | undefined;
    let previousRate = 1;
    let boosting = false;
    let suppressClick = false;
    const nativeMedia = media instanceof HTMLMediaElement ? media : null;

    const stopLongPress = () => {
      window.clearTimeout(timer);
      timer = undefined;
      pointer = undefined;
      if (!boosting) return;

      boosting = false;
      if (isMediaPlaybackRateCapable(media)) {
        media.playbackRate = previousRate;
      }
      setActive(false);
      suppressClick = true;
      window.clearTimeout(suppressClickTimer);
      suppressClickTimer = window.setTimeout(() => {
        suppressClick = false;
      }, 500);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        !event.isPrimary ||
        (event.pointerType === 'mouse' && event.button !== 0) ||
        isInteractiveTarget(event.target) ||
        isTouchFullscreenLandscape(event) ||
        media.paused ||
        !isMediaPlaybackRateCapable(media)
      ) {
        return;
      }

      stopLongPress();
      const touch = event.pointerType === 'touch';
      pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        tolerance: touch ? TOUCH_MOVE_TOLERANCE_PX : MOVE_TOLERANCE_PX,
      };
      timer = window.setTimeout(
        () => {
          timer = undefined;
          previousRate = media.playbackRate;
          media.playbackRate = 2;
          boosting = true;
          setActive(true);
        },
        touch ? TOUCH_LONG_PRESS_DELAY_MS : LONG_PRESS_DELAY_MS
      );
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        pointer?.id === event.pointerId &&
        Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) >
          pointer.tolerance
      ) {
        stopLongPress();
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (
        pointer &&
        touch &&
        Math.hypot(touch.clientX - pointer.x, touch.clientY - pointer.y) >
          pointer.tolerance
      ) {
        stopLongPress();
      }
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (pointer?.id === event.pointerId) stopLongPress();
    };

    const handleClick = (event: MouseEvent) => {
      if (!suppressClick || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
      window.clearTimeout(suppressClickTimer);
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (pointer && !isInteractiveTarget(event.target)) event.preventDefault();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stopLongPress();
    };

    const handleCancel = () => stopLongPress();

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('click', handleClick, true);
    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    window.addEventListener('blur', stopLongPress);
    window.addEventListener(CANCEL_LONG_PRESS_EVENT, handleCancel);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    nativeMedia?.addEventListener('pause', stopLongPress);

    return () => {
      stopLongPress();
      window.clearTimeout(suppressClickTimer);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('click', handleClick, true);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('blur', stopLongPress);
      window.removeEventListener(CANCEL_LONG_PRESS_EVENT, handleCancel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      nativeMedia?.removeEventListener('pause', stopLongPress);
    };
  }, [container, media]);

  return active;
}
