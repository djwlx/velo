import { useEffect, useState } from 'react';
import {
  isMediaPauseCapable,
  isMediaPlaybackRateCapable,
  useContainer,
  useMedia,
} from '@videojs/react';

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(
    target.closest(
      'button, a, input, select, textarea, [role="button"], [role="slider"], [data-interactive]'
    )
  );

export function useLongPressSpeed() {
  const container = useContainer();
  const media = useMedia();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!container || !isMediaPauseCapable(media)) return;

    let timer: number | undefined;
    let suppressClickTimer: number | undefined;
    let pointer: { id: number; x: number; y: number } | undefined;
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
        media.paused ||
        !isMediaPlaybackRateCapable(media)
      ) {
        return;
      }

      stopLongPress();
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      timer = window.setTimeout(() => {
        timer = undefined;
        previousRate = media.playbackRate;
        media.playbackRate = 2;
        boosting = true;
        setActive(true);
      }, 450);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        pointer?.id === event.pointerId &&
        Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 12
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

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('click', handleClick, true);
    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    window.addEventListener('blur', stopLongPress);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    nativeMedia?.addEventListener('pause', stopLongPress);

    return () => {
      stopLongPress();
      window.clearTimeout(suppressClickTimer);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('click', handleClick, true);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('blur', stopLongPress);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      nativeMedia?.removeEventListener('pause', stopLongPress);
    };
  }, [container, media]);

  return active;
}
