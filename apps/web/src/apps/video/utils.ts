const VIDEO_EXTENSIONS = new Set([
  'mp4',
  'mkv',
  'avi',
  'mov',
  'wmv',
  'flv',
  'webm',
  'm4v',
  'rmvb',
  'mpeg',
  'mpg',
  'ts',
  'ogv',
  'ogg',
]);

const VIDEO_MIME_TYPES = new Map([
  ['mp4', 'video/mp4'],
  ['m4v', 'video/mp4'],
  ['webm', 'video/webm'],
  ['ogv', 'video/ogg'],
  ['ogg', 'video/ogg'],
]);

export const isVideoFileName = (name: string): boolean =>
  VIDEO_EXTENSIONS.has(name.split('.').pop()?.toLowerCase() ?? '');

export const getVideoMimeType = (name: string): string | undefined =>
  VIDEO_MIME_TYPES.get(name.split('.').pop()?.toLowerCase() ?? '');
