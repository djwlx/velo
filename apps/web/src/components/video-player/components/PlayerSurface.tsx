import type { CSSProperties } from 'react';
import { Video, VideoSkin, usePlayer } from '@videojs/react/video';

import type { VideoPlayerProps } from '../types';
import { LongPressSpeedGesture } from './LongPressSpeedGesture';

const surfaceStyle = {
  '--media-object-fit': 'contain',
  '--media-object-position': 'center',
} as CSSProperties;

export function PlayerSurface({ src, type, poster }: VideoPlayerProps) {
  const started = usePlayer((state) => state.started);

  return (
    <VideoSkin
      className="relative aspect-video h-auto w-full overflow-hidden rounded-lg fullscreen:aspect-auto fullscreen:size-full fullscreen:rounded-none"
      style={surfaceStyle}
    >
      <Video
        className="absolute inset-0 size-full object-contain object-center"
        style={{ visibility: started ? 'visible' : 'hidden' }}
        playsInline
        preload="metadata"
        poster={poster}
        src={type ? undefined : src}
      >
        {type ? <source src={src} type={type} /> : null}
      </Video>
      <LongPressSpeedGesture />
    </VideoSkin>
  );
}
