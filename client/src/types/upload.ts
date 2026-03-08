import type { AttachmentType } from "./attachment";

export interface UploadType {
  url: string;
  publicId: string;
  type: AttachmentType;
  filename: string;
  mimeType: string;
  size: number;
}
