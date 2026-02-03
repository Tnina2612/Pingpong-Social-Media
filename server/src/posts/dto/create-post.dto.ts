import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";

export class CreatePostDto {
  @ApiProperty({
    description: "Content of the post",
    example: "Just shared an amazing photo from my vacation!",
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: "Content cannot be empty" })
  content: string;

  @ApiProperty({
    description: "Array of media URLs attached to the post",
    example: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  @IsOptional()
  mediaUrls?: string[];
}
