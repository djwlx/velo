export interface UploadFileResponse {
  id: number;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string;
}
