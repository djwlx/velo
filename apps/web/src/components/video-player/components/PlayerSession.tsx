import { VideoPlayer as VideoJsPlayer } from '@videojs/react/video';

import { useVideoPoster } from '../hooks/useVideoPoster';
import type { VideoPlayerProps } from '../types';
import { PlayerSurface } from './PlayerSurface';

export function PlayerSession({ src, type, poster }: VideoPlayerProps) {
  const resolvedPoster = useVideoPoster(src, type, poster);

  return (
    <VideoJsPlayer poster={resolvedPoster}>
      <PlayerSurface src={src} type={type} poster={resolvedPoster} />
    </VideoJsPlayer>
  );
}
