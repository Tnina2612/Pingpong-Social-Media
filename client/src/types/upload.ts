import type { AttachmentType } from "./attachment";

export interface UploadType {
  id: string;
  url: string;
  publicId: string;
  type: AttachmentType;
  filename: string;
  mimeType: string;
  size: number;
}
