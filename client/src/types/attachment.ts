export const AttachmentType = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
  FILE: "FILE",
} as const;

export type AttachmentType =
  (typeof AttachmentType)[keyof typeof AttachmentType];

export interface Attachment {
  url: string;
  publicId: string;
  type: AttachmentType;
  filename: string;
  mimeType: string;
  size: number;
}
