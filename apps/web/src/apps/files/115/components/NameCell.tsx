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
import { isVideoFileName } from '../utils';

export interface NameCellProps {
  item: ItemsType;
  onActivate: () => void;
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
  if (isVideoFileName(name)) return <FileVideoCamera className={className} />;
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

export function NameCell({ item, onActivate }: NameCellProps) {
  const label = <TruncatedText text={item.name} />;

  if (item.isDir) {
    return (
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-1.5 text-primary hover:underline"
        onClick={onActivate}
      >
        <Folder className="size-4 shrink-0" />
        {label}
      </button>
    );
  }

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

  return (
    <button
      type="button"
      className="inline-flex max-w-full cursor-pointer items-center gap-1.5 text-left hover:underline"
      onClick={onActivate}
    >
      {content}
    </button>
  );
}
