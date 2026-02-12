import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from "class-validator";

export class CreateCommentDto {
  @ApiProperty({
    description: "ID of the post being commented on",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: String,
  })
  @IsUUID()
  postId: string;

  @ApiProperty({
    description: "ID of parent comment if this is a reply",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string; // If present, this is a Reply

  @ApiProperty({
    description: "Content of the comment",
    example: "Great post! Thanks for sharing.",
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: "Content cannot be empty" })
  content: string;

  @ApiProperty({
    description: "Array of media URLs attached to the comment",
    example: ["https://example.com/image1.jpg"],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  @IsOptional()
  mediaUrls?: string[];
}
