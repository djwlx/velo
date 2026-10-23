import AvatarEditor, { type AvatarEditorRef } from 'react-avatar-editor';
import { LoaderCircle, Pencil } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import {
  type Control,
  type FieldPathByValue,
  type FieldPathValue,
  type FieldValues,
  type UseFormSetValue,
} from 'react-hook-form';

import { AvatarImage } from '@/components/avatar-image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';

import { FormField } from './FormField';

const DEFAULT_MAX_SOURCE_SIZE = 50 * 1024 * 1024;
const CROP_SIZE = 256;
const DEFAULT_ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const;

export interface FormAvatarProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> {
  control: Control<TFieldValues>;
  name: TName;
  setValue: UseFormSetValue<TFieldValues>;
  onUpload: (file: File) => Promise<string>;
  fallbackText?: string;
  acceptedTypes?: readonly string[];
  maxFileSize?: number;
  onUploadError?: (error: unknown) => void;
}

export function FormAvatar<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  setValue,
  onUpload,
  fallbackText = '头像',
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = DEFAULT_MAX_SOURCE_SIZE,
  onUploadError,
}: FormAvatarProps<TFieldValues, TName>) {
  const editorRef = useRef<AvatarEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scale, setScale] = useState(1.2);
  const [uploading, setUploading] = useState(false);
  const accept = acceptedTypes.join(',');

  const closeEditor = () => {
    setDialogOpen(false);
    setSource(null);
    setScale(1.2);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      toast.add({ type: 'error', title: '请选择支持的图片格式' });
      return;
    }
    if (file.size > maxFileSize) {
      toast.add({
        type: 'error',
        title: `图片不能超过 ${Math.floor(maxFileSize / 1024 / 1024)} MB`,
      });
      return;
    }

    setSource(file);
    setScale(1.2);
    setDialogOpen(true);
  };

  const onSaveCrop = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const canvas = editorRef.current?.getImageScaledToCanvas();
      if (!canvas) {
        toast.add({ type: 'error', title: '图片尚未准备好，请稍后重试' });
        return;
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });
      if (!blob) {
        toast.add({ type: 'error', title: '无法处理这张图片，请换一张试试' });
        return;
      }

      const croppedFile = new File([blob], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      const avatarUrl = await onUpload(croppedFile);
      setValue(name, avatarUrl as FieldPathValue<TFieldValues, TName>, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.add({ type: 'success', title: '头像上传成功' });
      closeEditor();
    } catch (error) {
      if (onUploadError) {
        onUploadError(error);
      } else {
        toast.add({ type: 'error', title: '头像上传失败，请重试' });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <FormField control={control} name={name} className="items-center">
        {(field) => (
          <div className="flex justify-center">
            <input
              ref={fileInputRef}
              id={field.name}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={onFileChange}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="group/avatar relative size-24 overflow-hidden rounded-full p-0"
              aria-label="选择头像"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="relative block size-24 shrink-0 overflow-hidden rounded-full">
                <AvatarImage
                  src={field.value}
                  alt=""
                  className="size-24 rounded-full object-cover"
                  fallback={
                    <span className="flex size-24 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
                      {fallbackText.slice(0, 2).toUpperCase()}
                    </span>
                  }
                />
                <span
                  className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white transition-opacity duration-200 ease-out ${
                    uploading
                      ? 'opacity-100'
                      : 'opacity-0 group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100'
                  }`}
                >
                  {uploading ? (
                    <LoaderCircle className="size-6 animate-spin" />
                  ) : (
                    <Pencil className="size-6 scale-90 transition-transform duration-200 ease-out group-hover/avatar:scale-100 group-focus-visible/avatar:scale-100" />
                  )}
                </span>
              </span>
            </Button>
          </div>
        )}
      </FormField>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && !uploading) closeEditor();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>调整头像</DialogTitle>
            <DialogDescription>
              拖动图片调整位置，使用缩放滑块调整大小。
            </DialogDescription>
          </DialogHeader>
          {source && (
            <div className="flex flex-col items-center gap-4">
              <div className="max-w-full overflow-hidden rounded-lg">
                <AvatarEditor
                  ref={editorRef}
                  image={source}
                  width={CROP_SIZE}
                  height={CROP_SIZE}
                  border={32}
                  borderRadius={CROP_SIZE / 2}
                  scale={scale}
                  color={[0, 0, 0, 0.55]}
                  showGrid
                  onLoadFailure={() => {
                    toast.add({ type: 'error', title: '无法读取这张图片' });
                    closeEditor();
                  }}
                />
              </div>
              <label className="flex w-full items-center gap-3 text-sm text-muted-foreground">
                <span>缩放</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={scale}
                  aria-label="头像缩放"
                  className="min-w-0 flex-1 accent-primary"
                  onChange={(event) =>
                    setScale(Number(event.currentTarget.value))
                  }
                />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={closeEditor}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={!source || uploading}
              onClick={() => void onSaveCrop()}
            >
              {uploading ? (
                <>
                  <LoaderCircle
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                  上传中
                </>
              ) : (
                '裁剪并上传'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
