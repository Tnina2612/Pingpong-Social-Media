import { ApiProperty } from "@nestjs/swagger";
import { AttachmentType } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class AttachmentDto {
  @ApiProperty({
    description: "Public URL of the attachment",
    example: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    type: String,
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: "Cloudinary public ID of the attachment",
    example: "sample_image_123",
    type: String,
  })
  @IsString()
  publicId: string;

  @ApiProperty({
    description: "Type of attachment",
    enum: AttachmentType,
    example: AttachmentType.IMAGE,
  })
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @ApiProperty({
    description: "Original filename of the attachment",
    example: "vacation-photo.jpg",
    type: String,
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: "MIME type of the attachment",
    example: "image/jpeg",
    type: String,
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: "Size of the attachment in bytes",
    example: 2048576,
    type: Number,
  })
  @IsNumber()
  size: number;
}

export class CreatePostDto {
  @ApiProperty({
    description: "Content of the post",
    example: "Just shared an amazing photo from my vacation!",
  })
  @IsString()
  @IsNotEmpty({ message: "Content cannot be empty" })
  content: string;

  @ApiProperty({
    description: "Array of attachment ids for the post",
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  attachmentIds?: string[];
}
