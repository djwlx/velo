import type { ManagedFile } from '@velo/shared';
import { File, FileVideo2, Folder } from 'lucide-react';

import { TruncatedText } from '@/components/truncated-text';
import { isVideoFileName } from '@/apps/video/utils';

interface FileEntryNameProps {
  item: ManagedFile;
  onOpen: () => void;
}

export function FileEntryName({ item, onOpen }: FileEntryNameProps) {
  const Icon = item.isDirectory
    ? Folder
    : isVideoFileName(item.name)
      ? FileVideo2
      : File;

  return (
    <button
      type="button"
      className="inline-flex max-w-full items-center gap-1.5 text-primary hover:underline"
      onClick={onOpen}
    >
      <Icon className="size-4 shrink-0" />
      <TruncatedText text={item.name} />
    </button>
  );
}
