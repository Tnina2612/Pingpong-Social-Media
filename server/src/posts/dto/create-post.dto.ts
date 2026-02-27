import { ApiProperty } from "@nestjs/swagger";
import { AttachmentType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export interface AttachmentPayload {
  url: string;
  publicId: string;
  type: AttachmentType;
  filename: string;
  mimeType: string;
  size: number;
}

export class CreatePostDto {
  @ApiProperty({
    description: "Content of the post",
    example: "Just shared an amazing photo from my vacation!",
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: "Content cannot be empty" })
  content: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  attachments: AttachmentPayload[];
}
