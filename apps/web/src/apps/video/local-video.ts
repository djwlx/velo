const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "mkv",
  "avi",
  "mov",
  "wmv",
  "flv",
  "webm",
  "m4v",
  "rmvb",
  "mpeg",
  "mpg",
  "ts",
  "ogv",
]);

export interface LocalVideo {
  name: string;
  src: string;
  type?: string;
}

let selectedVideo: LocalVideo | null = null;

export const isLocalVideoFile = (file: File): boolean => {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    file.size > 0 &&
    (file.type.toLowerCase().startsWith("video/") || VIDEO_EXTENSIONS.has(extension))
  );
};

export const setLocalVideo = (file: File): LocalVideo => {
  if (!isLocalVideoFile(file)) {
    throw new TypeError("A non-empty video file is required");
  }

  if (selectedVideo) URL.revokeObjectURL(selectedVideo.src);

  selectedVideo = {
    name: file.name,
    src: URL.createObjectURL(file),
    ...(file.type.toLowerCase().startsWith("video/") ? { type: file.type } : {}),
  };
  return selectedVideo;
};

export const getLocalVideo = (): LocalVideo | null => selectedVideo;

export const clearLocalVideo = (src: string): void => {
  if (selectedVideo?.src !== src) return;
  URL.revokeObjectURL(selectedVideo.src);
  selectedVideo = null;
};
