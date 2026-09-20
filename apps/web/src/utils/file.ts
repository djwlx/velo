export type FileSize = number | string | null | undefined;

export const formatFileSize = (size: FileSize): string => {
  if (size === undefined || size === null || size === '') return '—';
  if (typeof size === 'string') return size;

  if (size < 1024) return `${size} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = size;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};
