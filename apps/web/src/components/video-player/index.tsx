import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  isMediaPlaybackRateCapable,
  useContainer,
  useMedia,
} from '@videojs/react';
import {
  Video,
  VideoPlayer as VideoJsPlayer,
  VideoSkin,
} from '@videojs/react/video';
import '@videojs/react/video/skin.css';

import { cn } from 'cn';

interface VideoPlayerProps {
  src: string;
  type?: string;
  poster?: string;
  className?: string;
}

function LongPressSpeedGesture() {
  const container = useContainer();
  const media = useMedia();
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const previousRateRef = useRef(1);
  const suppressClickRef = useRef(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!container || !media) return;

    let suppressClickTimer: number | null = null;

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        target.closest(
          'button, a, input, select, textarea, [role="button"], [role="slider"], [data-interactive]'
        )
      );

    const stopLongPress = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!activeRef.current) return;

      activeRef.current = false;
      if (isMediaPlaybackRateCapable(media)) {
        media.playbackRate = previousRateRef.current;
      }
      setActive(false);
      suppressClickRef.current = true;
      if (suppressClickTimer !== null) window.clearTimeout(suppressClickTimer);
      suppressClickTimer = window.setTimeout(() => {
        suppressClickRef.current = false;
        suppressClickTimer = null;
      }, 500);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        !event.isPrimary ||
        (event.pointerType === 'mouse' && event.button !== 0) ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (!isMediaPlaybackRateCapable(media)) return;

        previousRateRef.current = media.playbackRate;
        media.playbackRate = 2;
        activeRef.current = true;
        setActive(true);
      }, 450);
    };

    const handleClick = (event: MouseEvent) => {
      if (!suppressClickRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClickRef.current = false;
      if (suppressClickTimer !== null) {
        window.clearTimeout(suppressClickTimer);
        suppressClickTimer = null;
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('click', handleClick, true);
    window.addEventListener('pointerup', stopLongPress);
    window.addEventListener('pointercancel', stopLongPress);

    return () => {
      stopLongPress();
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (suppressClickTimer !== null) window.clearTimeout(suppressClickTimer);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('click', handleClick, true);
      window.removeEventListener('pointerup', stopLongPress);
      window.removeEventListener('pointercancel', stopLongPress);
    };
  }, [container, media]);

  return active ? (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
    >
      <span className="rounded-md bg-black/70 px-4 py-2 text-lg font-semibold text-white">
        2×
      </span>
    </span>
  ) : null;
}

export function VideoPlayer({
  src,
  type,
  poster,
  className,
}: VideoPlayerProps) {
  const [aspectRatio, setAspectRatio] = useState('16 / 9');

  return (
    <div className={cn('relative w-full', className)}>
      <VideoJsPlayer poster={poster}>
        <VideoSkin
          className="relative w-full overflow-hidden rounded-lg"
          style={
            {
              aspectRatio,
              '--media-object-fit': 'contain',
              '--media-object-position': 'center',
            } as CSSProperties
          }
        >
          <Video
            className="object-contain object-center"
            playsInline
            preload="metadata"
            src={type ? undefined : src}
            onLoadedMetadata={(event) => {
              const { videoWidth, videoHeight } = event.currentTarget;
              if (videoWidth > 0 && videoHeight > 0) {
                setAspectRatio(`${videoWidth} / ${videoHeight}`);
              }
            }}
          >
            {type ? <source src={src} type={type} /> : null}
          </Video>
          <LongPressSpeedGesture />
        </VideoSkin>
      </VideoJsPlayer>
    </div>
  );
}
