import { and, eq } from 'drizzle-orm';

import { db } from '../../libs/db/index.js';
import { users } from '../auth/user/schema.js';
import { uploadedFiles } from './schema.js';

export const createUploadedFile = (values: {
  storageKey: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  uploaderId: number;
}) =>
  db
    .insert(uploadedFiles)
    .values({ ...values, createdAt: new Date() })
    .returning({
      id: uploadedFiles.id,
      originalName: uploadedFiles.originalName,
      contentType: uploadedFiles.contentType,
      sizeBytes: uploadedFiles.sizeBytes,
      createdAt: uploadedFiles.createdAt,
    })
    .get();

export const getUploadedFileForOwner = (id: number, uploaderId: number) =>
  db
    .select()
    .from(uploadedFiles)
    .where(and(eq(uploadedFiles.id, id), eq(uploadedFiles.uploaderId, uploaderId)))
    .get();

export const getUploadedAvatarFile = (id: number) =>
  db
    .select({
      id: uploadedFiles.id,
      storageKey: uploadedFiles.storageKey,
      originalName: uploadedFiles.originalName,
      contentType: uploadedFiles.contentType,
      sizeBytes: uploadedFiles.sizeBytes,
      uploaderId: uploadedFiles.uploaderId,
      createdAt: uploadedFiles.createdAt,
    })
    .from(uploadedFiles)
    .innerJoin(users, eq(users.avatar, `/api/files/${id}`))
    .where(eq(uploadedFiles.id, id))
    .get();
