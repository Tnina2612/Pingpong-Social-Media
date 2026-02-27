import { ApiProperty } from "@nestjs/swagger";
import { AttachmentType } from "@prisma/client";
import { Expose } from "class-transformer";

export class UploadResponseDto {
  @ApiProperty({
    description: "Public URL of the uploaded file",
    example: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    type: String,
  })
  @Expose()
  url: string;

  @ApiProperty({
    description: "Cloudinary public ID for managing the file",
    example: "sample_image_123",
    type: String,
  })
  @Expose()
  publicId: string;

  @ApiProperty({
    description: "Resource type of the uploaded file",
    example: AttachmentType.IMAGE,
    enum: AttachmentType,
  })
  @Expose()
  type: AttachmentType;

  @ApiProperty({
    description: "Original filename of the uploaded file",
    example: "vacation-photo.jpg",
    type: String,
  })
  @Expose()
  filename: string;

  @ApiProperty({
    description: "MIME type of the uploaded file",
    example: "image/jpeg",
    type: String,
  })
  @Expose()
  mimeType: string;

  @ApiProperty({
    description: "File size in bytes",
    example: 2048576,
    type: Number,
  })
  @Expose()
  size: number;
}
