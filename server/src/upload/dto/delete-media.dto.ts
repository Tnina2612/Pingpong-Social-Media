import { AttachmentType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class DeleteAttachmentDto {
  @IsString()
  @IsNotEmpty()
  publicId: string;

  @IsEnum(AttachmentType)
  attachmentType: AttachmentType;
}
