import { TruncatedText } from '@/components/truncated-text';
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
import type { ItemsType } from '../types';

export interface NameCellProps {
  item: ItemsType;
  onOpen: () => void;
  onDownload: () => void;
  onPreview?: () => void;
}

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

function FileTypeIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';

  if (IMAGE_EXTENSIONS.has(extension))
    return <FileImage className={className} />;
  if (VIDEO_EXTENSIONS.has(extension))
    return <FileVideoCamera className={className} />;
  if (AUDIO_EXTENSIONS.has(extension))
    return <FileMusic className={className} />;
  if (ARCHIVE_EXTENSIONS.has(extension))
    return <FileArchive className={className} />;
  if (CODE_EXTENSIONS.has(extension)) return <FileCode className={className} />;
  if (SPREADSHEET_EXTENSIONS.has(extension))
    return <FileSpreadsheet className={className} />;
  if (PRESENTATION_EXTENSIONS.has(extension))
    return <Presentation className={className} />;
  if (DOCUMENT_EXTENSIONS.has(extension))
    return <FileText className={className} />;

  return <File className={className} />;
}

export function NameCell({ item, onOpen, onDownload, onPreview }: NameCellProps) {
  const label = <TruncatedText className="max-w-[50vw]" text={item.name} />;

  if (item.isDir) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-primary hover:underline"
        onClick={onOpen}
      >
        <Folder className="size-4 shrink-0" />
        {label}
      </button>
    );
  }

  const isImage = IMAGE_EXTENSIONS.has(
    item.name.split('.').pop()?.toLowerCase() ?? ''
  );

  const content = (
    <>
      <FileTypeIcon
        name={item.name}
        className="size-4 shrink-0 text-muted-foreground"
      />
      {label}
    </>
  );

  if (!item.pickCode) {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5">
        {content}
      </span>
    );
  }

  const onClick = isImage && onPreview ? onPreview : onDownload;

  return (
    <button
      type="button"
      className="inline-flex max-w-full items-center gap-1.5 text-left hover:underline"
      onClick={onClick}
    >
      {content}
    </button>
  );
}
