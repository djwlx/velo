import '@videojs/react/video/skin.css';

import { cn } from 'cn';
import { PlayerSession } from './components/PlayerSession';
import type { VideoPlayerProps } from './types';

export function VideoPlayer({
  className,
  autoPlay = false,
  autoFullScreen = false,
  ...props
}: VideoPlayerProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <PlayerSession
        key={JSON.stringify([props.src, props.type])}
        {...props}
        autoPlay={autoPlay}
        autoFullScreen={autoFullScreen}
      />
    </div>
  );
}
