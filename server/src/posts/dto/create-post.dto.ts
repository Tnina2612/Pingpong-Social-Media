import { ApiProperty } from "@nestjs/swagger";
import { AttachmentType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class AttachmentDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  publicId: string;

  @ApiProperty({ enum: AttachmentType })
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  @IsString()
  mimeType: string;

  @ApiProperty()
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
