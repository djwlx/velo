import {
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileMusic,
  FileSpreadsheet,
  FileText,
  FileVideoCamera,
  Folder,
  Presentation,
} from 'lucide-react';

import { isVideoFileName } from '@/apps/video/utils';
import { TruncatedText } from '@/components/truncated-text';
import { cn } from '@/lib/utils';

const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'avif',
  'heic',
  'ico',
  'tiff',
]);

const AUDIO_EXTENSIONS = new Set([
  'mp3',
  'flac',
  'wav',
  'aac',
  'ogg',
  'm4a',
  'wma',
  'ape',
  'opus',
]);

const ARCHIVE_EXTENSIONS = new Set([
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',
  'bz2',
  'xz',
  'iso',
  'tgz',
]);

const CODE_EXTENSIONS = new Set([
  'js',
  'ts',
  'jsx',
  'tsx',
  'json',
  'html',
  'css',
  'scss',
  'less',
  'py',
  'java',
  'go',
  'rs',
  'c',
  'cpp',
  'h',
  'sh',
  'yml',
  'yaml',
  'xml',
  'vue',
  'svelte',
]);

const SPREADSHEET_EXTENSIONS = new Set(['xls', 'xlsx', 'csv', 'numbers']);
const PRESENTATION_EXTENSIONS = new Set(['ppt', 'pptx', 'key']);
const DOCUMENT_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'txt',
  'md',
  'rtf',
  'pages',
]);

const PREVIEW_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
  'pdf',
]);

const getExtension = (name: string) =>
  name.split('.').pop()?.toLowerCase() ?? '';

export const isPreviewableFileName = (name: string): boolean =>
  isVideoFileName(name) || PREVIEW_EXTENSIONS.has(getExtension(name));

function getFileIcon(name: string) {
  const extension = getExtension(name);

  if (IMAGE_EXTENSIONS.has(extension)) return FileImage;
  if (isVideoFileName(name)) return FileVideoCamera;
  if (AUDIO_EXTENSIONS.has(extension)) return FileMusic;
  if (ARCHIVE_EXTENSIONS.has(extension)) return FileArchive;
  if (CODE_EXTENSIONS.has(extension)) return FileCode;
  if (SPREADSHEET_EXTENSIONS.has(extension)) return FileSpreadsheet;
  if (PRESENTATION_EXTENSIONS.has(extension)) return Presentation;
  if (DOCUMENT_EXTENSIONS.has(extension)) return FileText;

  return File;
}

export interface FileNameProps {
  name: string;
  isDirectory?: boolean;
  onActivate?: () => void;
  className?: string;
  iconClassName?: string;
}

export function FileName({
  name,
  isDirectory = false,
  onActivate,
  className,
  iconClassName,
}: FileNameProps) {
  const Icon = isDirectory ? Folder : getFileIcon(name);
  const content = (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <Icon
        className={cn(
          'size-4 shrink-0',
          !isDirectory && 'text-muted-foreground',
          iconClassName
        )}
      />
      <TruncatedText text={name} />
    </span>
  );

  if (!onActivate) return content;

  return (
    <button
      type="button"
      className={cn(
        'inline-flex max-w-full cursor-pointer items-center gap-1.5 text-left hover:underline',
        isDirectory && 'text-primary',
        className
      )}
      onClick={onActivate}
    >
      {content}
    </button>
  );
}
