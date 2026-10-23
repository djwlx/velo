import { useEffect, useState } from 'react';
import {
  isMediaPauseCapable,
  isMediaPlaybackRateCapable,
  useContainer,
  useMedia,
} from '@videojs/react';
import { usePlayer } from '@videojs/react/video';

const LONG_PRESS_DELAY = 450;
const TAP_MAX_DURATION = 300;
const DOUBLE_TAP_DELAY = 300;
const MOVE_THRESHOLD = 12;
const DOUBLE_TAP_DISTANCE = 40;
const BOOST_RATE = 2;
const SEEK_STEP = 10;

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(
    target.closest(
      'button, a, input, select, textarea, [role="button"], [role="slider"], [data-interactive]'
    )
  );

export function usePlayerGestures() {
  const container = useContainer();
  const media = useMedia();
  const player = usePlayer();
  const [boosting, setBoosting] = useState(false);

  useEffect(() => {
    if (!container) return;

    let longPressTimer: number | undefined;
    let singleTapTimer: number | undefined;
    let suppressClickTimer: number | undefined;
    let start:
      | {
          id: number;
          x: number;
          y: number;
          time: number;
          pointerType: string;
        }
      | undefined;
    let lastTap: { time: number; x: number; y: number } | undefined;
    let previousRate = 1;
    let active = false;
    let moved = false;
    let suppressClick = false;

    const clearLongPressTimer = () => {
      window.clearTimeout(longPressTimer);
      longPressTimer = undefined;
    };

    const stopBoost = () => {
      clearLongPressTimer();

      if (!active) return;

      active = false;
      if (isMediaPlaybackRateCapable(media)) {
        media.playbackRate = previousRate;
      }
      setBoosting(false);
    };

    const suppressNextClick = () => {
      suppressClick = true;
      window.clearTimeout(suppressClickTimer);
      suppressClickTimer = window.setTimeout(() => {
        suppressClick = false;
      }, 500);
    };

    const togglePaused = () => {
      if (player.state.paused) {
        void player.state.play().catch(() => undefined);
      } else {
        player.state.pause();
      }
    };

    const seekBy = (delta: number) => {
      const { currentTime, duration, seek } = player.state;
      const next = Math.max(0, currentTime + delta);
      const target =
        Number.isFinite(duration) && duration > 0
          ? Math.min(next, duration)
          : next;

      void seek(target).catch(() => undefined);
    };

    const toggleFullscreen = () => {
      const action = player.state.isFullscreen
        ? player.state.exitFullscreen()
        : player.state.requestFullscreen();

      void action.catch(() => undefined);
    };

    const activateDoubleTap = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0) return;

      const ratio = (clientX - rect.left) / rect.width;

      if (ratio < 1 / 3) {
        seekBy(-SEEK_STEP);
      } else if (ratio >= 2 / 3) {
        seekBy(SEEK_STEP);
      } else {
        toggleFullscreen();
      }
    };

    const activateSingleTap = (pointerType: string) => {
      if (pointerType === 'mouse') {
        togglePaused();
      } else {
        player.state.toggleControls();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        !event.isPrimary ||
        (event.pointerType === 'mouse' && event.button !== 0) ||
        !(event.target instanceof Node) ||
        !container.contains(event.target) ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      stopBoost();

      start = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        time: Date.now(),
        pointerType: event.pointerType,
      };
      moved = false;

      if (
        !player.state.paused &&
        isMediaPauseCapable(media) &&
        isMediaPlaybackRateCapable(media)
      ) {
        longPressTimer = window.setTimeout(() => {
          longPressTimer = undefined;
          previousRate = media.playbackRate;
          media.playbackRate = BOOST_RATE;
          active = true;
          setBoosting(true);
        }, LONG_PRESS_DELAY);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!start || start.id !== event.pointerId) return;

      if (
        Math.hypot(event.clientX - start.x, event.clientY - start.y) >
        MOVE_THRESHOLD
      ) {
        moved = true;
        stopBoost();
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!start || start.id !== event.pointerId) return;

      const current = start;
      start = undefined;
      clearLongPressTimer();

      const wasBoosting = active;
      const duration = Date.now() - current.time;

      stopBoost();

      event.stopPropagation();

      if (moved || wasBoosting || duration > TAP_MAX_DURATION) {
        if (wasBoosting) suppressNextClick();
        return;
      }

      if (
        !(event.target instanceof Node) ||
        !container.contains(event.target) ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      const now = Date.now();

      if (
        lastTap &&
        now - lastTap.time <= DOUBLE_TAP_DELAY &&
        Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) <=
          DOUBLE_TAP_DISTANCE
      ) {
        window.clearTimeout(singleTapTimer);
        singleTapTimer = undefined;
        lastTap = undefined;
        suppressNextClick();
        activateDoubleTap(event.clientX);
        return;
      }

      lastTap = { time: now, x: event.clientX, y: event.clientY };
      window.clearTimeout(singleTapTimer);
      singleTapTimer = window.setTimeout(() => {
        singleTapTimer = undefined;
        lastTap = undefined;
        activateSingleTap(current.pointerType);
      }, DOUBLE_TAP_DELAY);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (!start || start.id !== event.pointerId) return;

      start = undefined;
      moved = false;
      stopBoost();
    };

    const handleClick = (event: MouseEvent) => {
      if (
        !suppressClick ||
        !(event.target instanceof Node) ||
        !container.contains(event.target) ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
      window.clearTimeout(suppressClickTimer);
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (
        (start || active) &&
        event.target instanceof Node &&
        container.contains(event.target) &&
        !isInteractiveTarget(event.target)
      ) {
        event.preventDefault();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stopBoost();
    };

    const handleBlur = () => {
      stopBoost();
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerCancel, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopBoost();
      window.clearTimeout(singleTapTimer);
      window.clearTimeout(suppressClickTimer);
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerCancel, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [container, media, player]);

  return boosting;
}
