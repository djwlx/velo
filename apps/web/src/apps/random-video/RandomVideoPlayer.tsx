import { VideoPlayer } from '@/components/video-player';

interface RandomVideoPlayerProps {
  src: string;
  name: string;
}

/** Random feed uses the same player controls as the file preview page. Video
 * switching (vertical swipe / arrow keys) is handled by the feed page. */
export function RandomVideoPlayer({ src, name }: RandomVideoPlayerProps) {
  return (
    <div className="random-video-player h-full w-full">
      <VideoPlayer
        className="h-full w-full"
        src={src}
        type="application/vnd.apple.mpegurl"
        title={name}
        autoPlay
      />
    </div>
  );
}
