import { createPlayer, orientationLockFeature } from '@videojs/react';
import { videoFeatures } from '@videojs/react/video';

export const {
  Player: OrientationVideoPlayer,
  usePlayer: useOrientationVideoPlayer,
} = createPlayer({
  features: [...videoFeatures, orientationLockFeature],
});
