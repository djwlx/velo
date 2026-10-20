import { useEffect, useState, type ReactNode } from 'react';

import { downloadFile } from '@/services/file';

interface AvatarImageProps {
  src: string;
  alt: string;
  className: string;
  fallback: ReactNode;
}

export function AvatarImage({
  src,
  alt,
  className,
  fallback,
}: AvatarImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      return;
    }

    if (!src.startsWith('/api/files/')) {
      setResolvedSrc(src);
      return;
    }

    const fileMatch = /^\/api\/files\/(\d+)$/.exec(src);
    const fileId = Number(fileMatch?.[1]);
    if (!fileMatch || !Number.isSafeInteger(fileId) || fileId <= 0) {
      setResolvedSrc(null);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | undefined;
    let active = true;
    setResolvedSrc(null);

    void downloadFile(fileId, controller.signal)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setResolvedSrc(objectUrl);
      })
      .catch(() => {
        if (active) setResolvedSrc(null);
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return resolvedSrc ? (
    <img src={resolvedSrc} alt={alt} className={className} />
  ) : (
    fallback
  );
}
