import { useEffect, useMemo, useState } from 'react';

const MAX_POSTER_SIZE = 640;
const PREVIEW_TIMEOUT = 10_000;

export function useVideoPoster(src: string, type?: string, poster?: string) {
  const request = useMemo(() => ({ src, type, poster }), [src, type, poster]);
  const [generatedPoster, setGeneratedPoster] = useState<{
    request: typeof request;
    url: string;
  }>();

  useEffect(() => {
    const { src, type, poster } = request;
    if (poster) return;

    // Sources come from local object URLs or the authenticated same-origin proxy.
    // Keep extracted frames in memory and never send video content to a service.
    let source: URL;
    try {
      source = new URL(src, window.location.href);
    } catch {
      return;
    }
    if (
      source.origin !== window.location.origin ||
      !['blob:', 'https:', window.location.protocol].includes(source.protocol)
    ) {
      return;
    }

    const preview = document.createElement('video');
    if (type && !preview.canPlayType(type)) return;

    let disposed = false;
    let capturing = false;
    let objectUrl: string | undefined;
    let frameCallback: number | undefined;
    let animationFrame: number | undefined;
    const releasePreview = () => {
      window.clearTimeout(timeout);
      if (frameCallback !== undefined) {
        preview.cancelVideoFrameCallback(frameCallback);
        frameCallback = undefined;
      }
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }
      preview.removeEventListener('loadeddata', scheduleCapture);
      preview.removeEventListener('error', releasePreview);
      preview.pause();
      preview.removeAttribute('src');
      preview.load();
    };

    const scheduleCapture = () => {
      if (
        disposed ||
        capturing ||
        preview.seeking ||
        frameCallback !== undefined ||
        animationFrame !== undefined
      ) {
        return;
      }

      // Wait for the initial frame to be drawable without playing or seeking.
      if (typeof preview.requestVideoFrameCallback === 'function') {
        frameCallback = preview.requestVideoFrameCallback(() => {
          frameCallback = undefined;
          capturePreview();
        });
      }
      // Detached, paused videos may not receive frame callbacks in Chromium.
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = window.requestAnimationFrame(() => {
          animationFrame = undefined;
          capturePreview();
        });
      });
    };

    const capturePreview = () => {
      if (
        disposed ||
        capturing ||
        preview.seeking ||
        preview.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        preview.videoWidth <= 0 ||
        preview.videoHeight <= 0
      ) {
        return;
      }
      capturing = true;

      try {
        const scale = Math.min(
          1,
          MAX_POSTER_SIZE / Math.max(preview.videoWidth, preview.videoHeight)
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(preview.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(preview.videoHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          releasePreview();
          return;
        }
        context.drawImage(preview, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (disposed) return;
            if (blob) {
              objectUrl = URL.createObjectURL(blob);
              setGeneratedPoster({ request, url: objectUrl });
            }
            releasePreview();
          },
          'image/jpeg',
          0.8
        );
      } catch {
        // Unsupported or protected media must still be playable without a poster.
        releasePreview();
      }
    };

    const timeout = window.setTimeout(() => {
      disposed = true;
      releasePreview();
    }, PREVIEW_TIMEOUT);
    preview.muted = true;
    preview.playsInline = true;
    preview.preload = 'auto';
    preview.addEventListener('loadeddata', scheduleCapture);
    preview.addEventListener('error', releasePreview);
    preview.src = source.href;
    preview.load();

    return () => {
      disposed = true;
      releasePreview();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [request]);

  return (
    poster ||
    (generatedPoster?.request === request ? generatedPoster.url : undefined)
  );
}
