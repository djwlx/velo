import '@videojs/react/video/skin.css';

import { cn } from 'cn';
import { PlayerSession } from './components/PlayerSession';
import type { VideoPlayerProps } from './types';

export function VideoPlayer({ className, ...props }: VideoPlayerProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <PlayerSession key={JSON.stringify([props.src, props.type])} {...props} />
    </div>
  );
}
