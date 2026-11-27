import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, LoaderCircle, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter';

import {
  getRandomVideo,
  getRandomVideoStreamUrl,
  type RandomVideoInfo,
} from '@/services/pan115';

import { RandomVideoPlayer } from './RandomVideoPlayer';
import { isShortcutBlocked, isTouchNavigationBlocked } from './shortcuts';

type FeedVideo = {
  id: string;
  name: string;
  src: string;
};

const SEEK_SECONDS = 10;
const WHEEL_THRESHOLD = 20;
const SWIPE_THRESHOLD_PX = 60;
const NAVIGATION_COOLDOWN_MS = 500;
const MAX_DUPLICATE_RETRIES = 5;
const MAX_EXCLUDE_CODES = 500;

const isNotFound = (error: unknown): boolean =>
  error instanceof Error &&
  'status' in error &&
  (error as { status?: number }).status === 404;

const isFullscreenActive = (): boolean =>
  typeof document !== 'undefined' &&
  Boolean(
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null })
      .webkitFullscreenElement
  );

export function RandomVideoPage() {
  const [, navigate] = useLocation();

  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);

  const seenIds = useRef(new Set<string>());
  const loadingRef = useRef(false);
  const navigationLock = useRef(false);
  const touchStartY = useRef<number | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setError(null);
    setExhausted(false);

    try {
      let selected: RandomVideoInfo | undefined;
      for (let attempt = 0; attempt < MAX_DUPLICATE_RETRIES; attempt++) {
        const candidate = await getRandomVideo(
          [...seenIds.current].slice(-MAX_EXCLUDE_CODES)
        );
        if (!seenIds.current.has(candidate.pickCode)) {
          selected = candidate;
          break;
        }
      }

      if (!selected) {
        setError('暂时没找到新视频，请重试');
        return;
      }

      seenIds.current.add(selected.pickCode);
      setVideos((current) =>
        current.some((item) => item.id === selected!.pickCode)
          ? current
          : [
              ...current,
              {
                id: selected!.pickCode,
                name: selected!.name || '随机视频',
                src: getRandomVideoStreamUrl(selected!.pickCode),
              },
            ]
      );
    } catch (caught) {
      if (isNotFound(caught)) {
        setExhausted(true);
      } else {
        setError('视频加载失败，请稍后重试');
      }
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMore(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMore]);

  useEffect(() => {
    if (error || exhausted || index < videos.length - 1) return;
    const timer = window.setTimeout(() => void loadMore(), 0);
    return () => window.clearTimeout(timer);
  }, [error, exhausted, index, videos.length, loadMore]);

  const go = useCallback(
    (step: 1 | -1) => {
      if (navigationLock.current) return;

      navigationLock.current = true;
      window.setTimeout(() => {
        navigationLock.current = false;
      }, NAVIGATION_COOLDOWN_MS);

      setDirection(step);
      setIndex((current) => {
        const next = current + step;
        return next >= 0 && next < videos.length ? next : current;
      });
    },
    [videos.length]
  );

  useEffect(() => {
    const seekVideo = (seconds: number) => {
      const video = document.querySelector<HTMLVideoElement>(
        '.random-video-player video'
      );
      if (!video || !Number.isFinite(video.duration)) return;
      video.currentTime = Math.min(
        Math.max(video.currentTime + seconds, 0),
        video.duration
      );
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) return;
      event.preventDefault();
      go(event.deltaY > 0 ? 1 : -1);
    };
    const handleCaptureKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        if (isShortcutBlocked(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        seekVideo(event.key === 'ArrowRight' ? SEEK_SECONDS : -SEEK_SECONDS);
        return;
      }
      if (
        isFullscreenActive() &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
      ) {
        event.preventDefault();
        event.stopPropagation();
        go(event.key === 'ArrowDown' ? 1 : -1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const fullscreen = isFullscreenActive();
      if (event.key === 'Escape') {
        if (!fullscreen) navigate('/');
        return;
      }
      if (fullscreen || isShortcutBlocked(event.target)) return;
      if (event.key === 'ArrowDown') go(1);
      else if (event.key === 'ArrowUp') go(-1);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleCaptureKeyDown, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleCaptureKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [go, navigate]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (isTouchNavigationBlocked(event.target)) {
      touchStartY.current = null;
      return;
    }
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (isTouchNavigationBlocked(event.target)) {
      touchStartY.current = null;
      return;
    }
    if (touchStartY.current === null) return;
    const deltaY =
      touchStartY.current -
      (event.changedTouches[0]?.clientY ?? touchStartY.current);
    touchStartY.current = null;
    if (Math.abs(deltaY) < SWIPE_THRESHOLD_PX) return;
    go(deltaY > 0 ? 1 : -1);
  };

  const activeVideo = videos[index];

  // Native fullscreen on mobile shows the document title; keep it in sync with
  // the current video instead of the app's default "velo" title.
  useEffect(() => {
    const originalTitle = document.title;
    document.title = activeVideo?.name ?? originalTitle;
    return () => {
      document.title = originalTitle;
    };
  }, [activeVideo?.name]);

  return (
    <main
      className="fixed inset-0 h-dvh w-screen select-none overflow-hidden overscroll-none bg-black text-white touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        aria-label="返回首页"
        onClick={() => navigate('/')}
        className="absolute left-4 top-4 z-40 grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/65"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>

      {activeVideo ? (
        <AnimatePresence initial={false}>
          <motion.div
            key={activeVideo.id}
            initial={{ y: direction > 0 ? '100%' : '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: direction > 0 ? '-100%' : '100%' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <RandomVideoPlayer src={activeVideo.src} name={activeVideo.name} />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          {error ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-white/80">{error}</p>
              <button
                type="button"
                onClick={() => void loadMore()}
                className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur-sm transition hover:bg-white/25"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                重试
              </button>
            </div>
          ) : exhausted ? (
            <p className="text-sm text-white/70">缓存视频已全部看完</p>
          ) : (
            <LoaderCircle
              className="size-8 animate-spin text-white/80"
              aria-label="加载中"
            />
          )}
        </div>
      )}

      {exhausted && activeVideo && index === videos.length - 1 ? (
        <div className="absolute bottom-2 left-1/2 z-30 -translate-x-1/2 text-[11px] text-white/55">
          已看完缓存视频，可上滑回看
        </div>
      ) : null}
    </main>
  );
}

export default RandomVideoPage;
