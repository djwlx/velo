import { lazy, Suspense, useEffect, useState, type CSSProperties } from 'react';
import { useCallback, type SyntheticEvent } from 'react';
import { Video, VideoSkin } from '@videojs/react/video';

import { useOrientationVideoPlayer } from '../create-player';
import type { VideoPlayerProps } from '../types';
import { LongPressSpeedGesture } from './LongPressSpeedGesture';

const HLS_MIME = 'application/vnd.apple.mpegurl';
const HlsJsVideo = lazy(() =>
  import('@videojs/react/media/hlsjs-video').then((module) => ({
    default: module.HlsJsVideo,
  }))
);

const surfaceStyle = {
  '--media-object-fit': 'contain',
  '--media-object-position': 'center',
} as CSSProperties;

export function PlayerSurface({
  src,
  type,
  poster,
  autoPlay = false,
  autoFullScreen = false,
}: VideoPlayerProps) {
  const store = useOrientationVideoPlayer();
  const started = useOrientationVideoPlayer((state) => state.started);
  const shouldAutoFullScreen = autoPlay && autoFullScreen;
  const [isLandscape, setIsLandscape] = useState(false);
  const isHlsSource =
    type === HLS_MIME ||
    type === 'application/x-mpegurl' ||
    /\.m3u8(?:$|\?)/i.test(src);

  useEffect(() => {
    store.setOrientationLockType(isLandscape ? 'landscape' : 'any');
  }, [isLandscape, store]);

  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setIsLandscape(
      video.videoWidth > video.videoHeight && video.videoWidth > 0
    );
  };

  const handlePlay = useCallback(
    (_event: SyntheticEvent<HTMLVideoElement>) => {
      void store.requestFullscreen().catch(() => undefined);
    },
    [store]
  );

  return (
    <VideoSkin
      className="relative aspect-video h-auto w-full overflow-hidden rounded-lg fullscreen:aspect-auto fullscreen:size-full fullscreen:rounded-none"
      style={surfaceStyle}
    >
      {isHlsSource ? (
        <Suspense fallback={null}>
          <HlsJsVideo
            className="absolute inset-0 size-full object-contain object-center"
            style={{ visibility: started ? 'visible' : 'hidden' }}
            source={{ src, type: HLS_MIME, maxAutoResolution: '1080p' }}
            autoPlay={autoPlay}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={shouldAutoFullScreen ? handlePlay : undefined}
            playsInline={!shouldAutoFullScreen}
            preload="metadata"
            poster={poster}
          />
        </Suspense>
      ) : (
        <Video
          className="absolute inset-0 size-full object-contain object-center"
          style={{ visibility: started ? 'visible' : 'hidden' }}
          autoPlay={autoPlay}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={shouldAutoFullScreen ? handlePlay : undefined}
          playsInline={!shouldAutoFullScreen}
          preload="metadata"
          poster={poster}
          src={type ? undefined : src}
        >
          {type ? <source src={src} type={type} /> : null}
        </Video>
      )}
      <LongPressSpeedGesture />
    </VideoSkin>
  );
}
