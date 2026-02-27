import { ApiProperty } from "@nestjs/swagger";
import { AttachmentType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class DeleteAttachmentDto {
  @ApiProperty({
    description: "Cloudinary public ID of the attachment to delete",
    example: "sample_image_123",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  publicId: string;

  @ApiProperty({
    description: "Type of attachment to delete",
    enum: AttachmentType,
    example: AttachmentType.IMAGE,
  })
  @IsEnum(AttachmentType)
  attachmentType: AttachmentType;
}
