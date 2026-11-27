import { OrientationVideoPlayer } from '../create-player';
import { useVideoPoster } from '../hooks/useVideoPoster';
import type { VideoPlayerProps } from '../types';
import { PlayerSurface } from './PlayerSurface';

export function PlayerSession({
  src,
  type,
  poster,
  title,
  autoPlay,
  autoFullScreen,
}: VideoPlayerProps) {
  const resolvedPoster = useVideoPoster(src, type, poster);

  return (
    <OrientationVideoPlayer
      poster={resolvedPoster}
      title={title}
      orientationLockType="any"
    >
      <PlayerSurface
        src={src}
        type={type}
        poster={resolvedPoster}
        autoPlay={autoPlay}
        autoFullScreen={autoFullScreen}
      />
    </OrientationVideoPlayer>
  );
}
